"""Vercel serverless endpoint for private Resepin ingredient detection."""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import tempfile
from email.parser import BytesParser
from email.policy import default
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import cv2
import numpy as np
from ultralytics import YOLO

import server


MAX_UPLOAD = 4_000_000
MAX_IMAGE_SIDE = 6000
MAX_IMAGE_PIXELS = 24_000_000
MODEL_CACHE = Path(tempfile.gettempdir()) / "resep-model-best.pt"
MODEL_REPO = "anrahadi-dotcom/resepin-models"
MODEL_BRANCH = "main"
MODEL_PATH = "best.pt"
_model_lock = Lock()


def _github_json(url: str, token: str, *, method: str = "GET", body: bytes | None = None) -> dict:
    request = Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/vnd.git-lfs+json" if method == "POST" else "application/json",
            "User-Agent": "Resepin-Vercel",
        },
    )
    with urlopen(request, timeout=20) as response:
        return json.loads(response.read())


def _download_model() -> Path:
    if MODEL_CACHE.is_file() and MODEL_CACHE.stat().st_size > 0:
        return MODEL_CACHE

    token = os.environ.get("RESEPIN_GITHUB_TOKEN")
    if not token:
        raise RuntimeError("Model privat belum terhubung. Tambahkan RESEPIN_GITHUB_TOKEN di Vercel.")

    contents_url = f"https://api.github.com/repos/{MODEL_REPO}/contents/{MODEL_PATH}?ref={MODEL_BRANCH}"
    pointer = _github_json(contents_url, token)
    encoded_pointer = pointer.get("content", "").replace("\n", "")
    lfs_pointer = base64.b64decode(encoded_pointer).decode("ascii", errors="strict")
    oid_match = re.search(r"^oid sha256:([0-9a-f]{64})$", lfs_pointer, re.MULTILINE)
    size_match = re.search(r"^size (\d+)$", lfs_pointer, re.MULTILINE)
    if not oid_match or not size_match:
        raise RuntimeError("Pointer model Git LFS tidak valid.")

    oid = oid_match.group(1)
    size = int(size_match.group(1))
    if size <= 0 or size > 100_000_000:
        raise RuntimeError("Ukuran model di luar batas yang diizinkan.")

    lfs_endpoint = f"https://github.com/{MODEL_REPO}.git/info/lfs/objects/batch"
    lfs_body = json.dumps({
        "operation": "download",
        "transfers": ["basic"],
        "ref": {"name": f"refs/heads/{MODEL_BRANCH}"},
        "objects": [{"oid": oid, "size": size}],
    }).encode("utf-8")
    credentials = base64.b64encode(f"x-access-token:{token}".encode()).decode("ascii")
    batch_request = Request(
        lfs_endpoint,
        data=lfs_body,
        method="POST",
        headers={
            "Authorization": f"Basic {credentials}",
            "Accept": "application/vnd.git-lfs+json",
            "Content-Type": "application/vnd.git-lfs+json",
            "User-Agent": "Resepin-Vercel",
        },
    )
    with urlopen(batch_request, timeout=20) as response:
        batch = json.loads(response.read())
    objects = batch.get("objects", [])
    if not objects or "error" in objects[0]:
        raise RuntimeError("GitHub tidak menyediakan file model LFS.")
    action = objects[0].get("actions", {}).get("download", {})
    if not action.get("href"):
        raise RuntimeError("Git LFS tidak memberi alamat unduh model.")

    download_request = Request(action["href"], headers=action.get("header", {}))
    with urlopen(download_request, timeout=45) as response:
        content = response.read(size + 1)
    if len(content) != size or hashlib.sha256(content).hexdigest() != oid:
        raise RuntimeError("Verifikasi integritas model gagal.")

    temporary_path = MODEL_CACHE.with_suffix(".tmp")
    temporary_path.write_bytes(content)
    temporary_path.replace(MODEL_CACHE)
    return MODEL_CACHE


def _get_detector():
    if server.DETECTOR is not None:
        return server.DETECTOR
    with _model_lock:
        if server.DETECTOR is None:
            server.DETECTOR = YOLO(str(_download_model()))
    return server.DETECTOR


class handler(BaseHTTPRequestHandler):
    def _json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        self._json(200, {"ready": bool(os.environ.get("RESEPIN_GITHUB_TOKEN")), "runtime": "vercel"})

    def do_POST(self) -> None:
        origin = self.headers.get("Origin")
        host = self.headers.get("Host", "")
        if origin and origin.rstrip("/") not in {
            f"https://{host}", f"http://{host}",
        }:
            self._json(403, {"detail": "Permintaan harus berasal dari situs Resepin."})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_UPLOAD + 64_000:
            self._json(413, {"detail": "Foto kosong atau terlalu besar (maksimal 4 MB)."})
            return
        content_type = self.headers.get("Content-Type", "")
        if not content_type.lower().startswith("multipart/form-data"):
            self._json(400, {"detail": "Kirim foto sebagai multipart/form-data."})
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
            self._json(415, {"detail": "Kirim foto JPG, PNG, atau WebP."})
            return

        payload = part.get_payload(decode=True)
        if not payload or len(payload) > MAX_UPLOAD:
            self._json(413, {"detail": "Foto kosong atau terlalu besar (maksimal 4 MB)."})
            return

        image = cv2.imdecode(np.frombuffer(payload, dtype=np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            self._json(400, {"detail": "File tidak terbaca sebagai gambar."})
            return
        height, width = image.shape[:2]
        if max(height, width) > MAX_IMAGE_SIDE or height * width > MAX_IMAGE_PIXELS:
            self._json(413, {"detail": "Resolusi foto terlalu besar. Coba foto yang lebih kecil."})
            return

        try:
            server.DETECTOR = _get_detector()
            detections = server.detect(image)
        except (HTTPError, URLError, TimeoutError, RuntimeError, ValueError) as error:
            print(f"Model Resepin gagal disiapkan: {error}")
            self._json(503, {"detail": "Model scan belum siap. Periksa token model privat di pengaturan Vercel."})
            return
        except Exception as error:
            print(f"Inferensi Resepin gagal: {error}")
            self._json(500, {"detail": "Model gagal memeriksa foto. Coba lagi."})
            return

        self._json(200, {"image_width": width, "image_height": height, "detections": detections})

    def log_message(self, format: str, *args: object) -> None:
        print(f"[Resepin API] {format % args}")
