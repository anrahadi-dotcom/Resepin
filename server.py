"""Small local web server and ingredient detector for Resepin."""

from __future__ import annotations

import json
import mimetypes
from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import unquote, urlsplit

import cv2
import numpy as np
from ultralytics import YOLO


ROOT = Path(__file__).resolve().parent
MODEL = ROOT / "models" / "best.pt"
MAX_UPLOAD = 10 * 1024 * 1024
MAX_IMAGE_SIDE = 6000
PREDICTION_LOCK = Lock()
DETECTOR = None


def detect(image: np.ndarray) -> list[dict[str, object]]:
    with PREDICTION_LOCK:
        result = DETECTOR.predict(image, conf=0.35, imgsz=640, max_det=30, verbose=False)[0]

    if result.boxes is None or len(result.boxes) == 0:
        return []

    names = result.names
    detections = []
    for box in result.boxes:
        class_id = int(box.cls.item())
        label = names.get(class_id, str(class_id)) if isinstance(names, dict) else names[class_id]
        detections.append({
            "label": str(label),
            "confidence": float(box.conf.item()),
            "bbox": [float(value) for value in box.xyxy[0].tolist()],
        })
    return detections


class ResepinHandler(BaseHTTPRequestHandler):
    def send_json(self, status: int, body: dict[str, object]) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        path = unquote(urlsplit(self.path).path)
        if path == "/api/health":
            self.send_json(200, {"ready": DETECTOR is not None})
            return

        pages = {
            "/": ROOT / "index.html",
            "/main.js": ROOT / "main.js",
            "/style.css": ROOT / "style.css",
        }
        file_path = pages.get(path)
        if path.startswith("/assets/"):
            file_path = ROOT / path.lstrip("/")
            try:
                file_path.resolve().relative_to((ROOT / "assets").resolve())
            except ValueError:
                file_path = None

        if file_path is None or not file_path.is_file():
            self.send_error(404, "File not found")
            return

        content = file_path.read_bytes()
        content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/api/detect":
            self.send_error(404, "Endpoint not found")
            return

        origin = self.headers.get("Origin")
        if origin and origin.rstrip("/") != f"http://{self.headers.get('Host', '')}":
            self.send_json(403, {"detail": "Permintaan harus berasal dari server Resepin lokal."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_UPLOAD + 64_000:
            self.send_json(413, {"detail": "Foto kosong atau terlalu besar (maksimal 10 MB)."})
            return

        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("multipart/form-data"):
            self.send_json(400, {"detail": "Kirim foto sebagai multipart/form-data."})
            return

        message = BytesParser(policy=default).parsebytes(
            f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("ascii")
            + self.rfile.read(length)
        )
        part = next((
            item for item in message.iter_parts()
            if item.get_content_disposition() == "form-data"
            and item.get_param("name", header="content-disposition") == "file"
        ), None)
        if part is None or part.get_content_type() not in {"image/jpeg", "image/png", "image/webp"}:
            self.send_json(415, {"detail": "Kirim foto JPG, PNG, atau WebP."})
            return

        payload = part.get_payload(decode=True)
        if not payload or len(payload) > MAX_UPLOAD:
            self.send_json(413, {"detail": "Foto kosong atau terlalu besar (maksimal 10 MB)."})
            return

        image = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            self.send_json(400, {"detail": "File tidak terbaca sebagai gambar."})
            return

        height, width = image.shape[:2]
        if max(height, width) > MAX_IMAGE_SIDE or height * width > 24_000_000:
            self.send_json(413, {"detail": "Resolusi foto terlalu besar. Coba foto yang lebih kecil."})
            return

        try:
            detections = detect(image)
        except Exception:
            self.log_error("Model gagal memeriksa foto")
            self.send_json(500, {"detail": "Model gagal memeriksa foto. Coba lagi."})
            return

        self.send_json(200, {
            "image_width": width,
            "image_height": height,
            "detections": detections,
        })

    def log_message(self, format: str, *args: object) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")


def main() -> None:
    global DETECTOR
    if not MODEL.is_file():
        raise SystemExit(f"Model tidak ditemukan: {MODEL}\nClone repo privat resepin-models ke folder models terlebih dahulu.")

    print("Memuat model bahan...")
    DETECTOR = YOLO(str(MODEL))
    server = ThreadingHTTPServer(("127.0.0.1", 8000), ResepinHandler)
    print("Resepin aktif: http://127.0.0.1:8000 (Ctrl+C untuk berhenti)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer Resepin berhenti.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
