"""Local-only FastAPI service for Resepin's PyTorch ingredient detector."""

from __future__ import annotations

import ipaddress
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Lock
from typing import AsyncIterator

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from ultralytics import YOLO


PROJECT_DIR = Path(__file__).resolve().parent
MODEL_PATH = PROJECT_DIR / "models" / "best.pt"
MAX_IMAGE_BYTES = 10 * 1024 * 1024
MAX_IMAGE_DIMENSION = 6000
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
INFERENCE_LOCK = Lock()
LOGGER = logging.getLogger("resepin.detector")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if not MODEL_PATH.is_file():
        raise RuntimeError(f"Checkpoint PyTorch tidak ditemukan: {MODEL_PATH}")
    try:
        app.state.detector = await run_in_threadpool(YOLO, str(MODEL_PATH))
    except Exception as error:
        raise RuntimeError(
            "Model gagal dimuat. Pasang dependensi dari requirements.txt "
            "dan pastikan checkpoint Ultralytics kompatibel."
        ) from error
    LOGGER.info("Model bahan Resepin siap (%s).", MODEL_PATH.name)
    yield
    app.state.detector = None


app = FastAPI(
    title="Resepin local ingredient detector",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


def ensure_local_request(request: Request) -> None:
    peer = request.client.host if request.client else ""
    try:
        if not ipaddress.ip_address(peer).is_loopback:
            raise HTTPException(status_code=403, detail="Deteksi hanya tersedia dari komputer ini.")
    except ValueError as error:
        raise HTTPException(status_code=403, detail="Deteksi hanya tersedia dari komputer ini.") from error

    origin = request.headers.get("origin")
    local_origin = str(request.base_url).rstrip("/")
    if origin and origin.rstrip("/") != local_origin:
        raise HTTPException(status_code=403, detail="Permintaan lintas situs tidak diizinkan.")


@app.get("/api/health")
async def health(request: Request) -> dict[str, bool]:
    ensure_local_request(request)
    return {"ready": getattr(request.app.state, "detector", None) is not None}


@app.post("/api/detect")
async def detect_ingredients(
    request: Request,
    file: UploadFile = File(...),
) -> dict[str, object]:
    ensure_local_request(request)
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Gunakan foto JPG, PNG, atau WebP.")

    payload = await file.read(MAX_IMAGE_BYTES + 1)
    await file.close()
    if not payload:
        raise HTTPException(status_code=400, detail="File foto kosong.")
    if len(payload) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran foto maksimal 10 MB.")

    image = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="File tidak dapat dibaca sebagai gambar.")

    height, width = image.shape[:2]
    if max(height, width) > MAX_IMAGE_DIMENSION or height * width > 24_000_000:
        raise HTTPException(status_code=413, detail="Resolusi foto terlalu besar. Coba foto yang lebih kecil.")

    detector = getattr(request.app.state, "detector", None)
    if detector is None:
        raise HTTPException(status_code=503, detail="Model PyTorch belum siap.")

    try:
        results = await run_in_threadpool(run_detection, detector, image)
    except Exception:
        LOGGER.exception("Inferensi model bahan gagal.")
        raise HTTPException(status_code=503, detail="Model gagal memeriksa foto. Coba lagi.") from None

    return {"image_width": width, "image_height": height, "detections": results}


def run_detection(detector: YOLO, image: np.ndarray) -> list[dict[str, object]]:
    with INFERENCE_LOCK:
        result = detector.predict(image, conf=0.35, imgsz=640, max_det=30, verbose=False)[0]

    if result.boxes is None or len(result.boxes) == 0:
        return []

    names = result.names
    boxes_xyxy = result.boxes.xyxy.cpu().tolist()
    class_ids = result.boxes.cls.cpu().tolist()
    confidences = result.boxes.conf.cpu().tolist()

    detections: list[dict[str, object]] = []
    for coordinates, class_id, confidence in zip(boxes_xyxy, class_ids, confidences):
        index = int(class_id)
        label = names.get(index, str(index)) if isinstance(names, dict) else names[index]
        detections.append(
            {
                "label": str(label),
                "confidence": float(confidence),
                "bbox": [float(coordinate) for coordinate in coordinates],
            }
        )
    return detections


@app.get("/", include_in_schema=False)
async def home() -> FileResponse:
    return FileResponse(PROJECT_DIR / "index.html", media_type="text/html")


@app.get("/main.js", include_in_schema=False)
async def frontend_script() -> FileResponse:
    return FileResponse(PROJECT_DIR / "main.js", media_type="text/javascript")


@app.get("/style.css", include_in_schema=False)
async def frontend_styles() -> FileResponse:
    return FileResponse(PROJECT_DIR / "style.css", media_type="text/css")
