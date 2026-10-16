FROM python:3.12-slim

ENV HOST=0.0.0.0 \
    PORT=8080 \
    PYTHONUNBUFFERED=1 \
    YOLO_CONFIG_DIR=/tmp/ultralytics

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py data_classes.yaml ./
COPY models/best.pt ./models/best.pt

EXPOSE 8080
CMD ["python", "server.py"]
