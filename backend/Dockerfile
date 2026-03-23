# ─────────────────────────────────────────────────────────────────────────────
# SafeConfig AI — Production Dockerfile
# Optimized for Google Cloud Run (Jaipur Node)
# ─────────────────────────────────────────────────────────────────────────────

# 1. Base image: slim for faster Cloud Run cold starts
FROM python:3.12-slim

# 2. Environment variables baked into the image
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    # Cloud Run always injects $PORT (default 8080). We set a fallback here
    # so the CMD works correctly in local `docker run` without -e PORT=...
    PORT=8080

# 3. Working directory
WORKDIR /app

# 4. System dependencies
#    - libpq-dev: required to compile psycopg2 (PostgreSQL driver)
#    - build-essential: required for any C-extension packages
#    - curl: used by Cloud Run health check probes (/healthz)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
#    Copy requirements first to leverage Docker layer caching —
#    dependencies are only reinstalled when requirements.txt changes.
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy application source
COPY . .

# 7. Cloud Run port declaration
EXPOSE 8080

# 8. Production entrypoint — Gunicorn
#
#    --bind :${PORT}     Binds to the port Cloud Run injects (usually 8080)
#    --workers 2         Two workers for parallel request handling
#    --threads 8         8 threads per worker — optimal for I/O-bound AI calls
#    --timeout 120       120s allows Claude/Gemini reasoning without killing workers
#                        (was 0 = unlimited; 120s is safer for Cloud Run's 3600s max)
#    --access-logfile -  Route access logs to stdout for Cloud Logging
#    --error-logfile -   Route error logs to stdout for Cloud Logging
#    index:app           Module:variable — Gunicorn imports index.py, uses `app`
#
CMD exec gunicorn \
    --bind :${PORT} \
    --workers 2 \
    --threads 8 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    index:app