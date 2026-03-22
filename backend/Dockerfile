# 1. Use an official Python runtime (Slim for Cloud Run performance)
FROM python:3.12-slim

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
# Ensure Cloud Run uses the correct environment
ENV FLASK_ENV=production 

# 3. Set the working directory
WORKDIR /app

# 4. Install system dependencies
# Added 'curl' for the /healthz probe and 'libpq5' for runtime Postgres support
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
# We use a cache mount to speed up subsequent builds
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy application code
COPY . .

# 7. Port Configuration
# Google Cloud Run injects $PORT (usually 8080)
EXPOSE 8080

# 8. Execution with Gunicorn
# Note: We use 'index:app' assuming index.py is in the root as we discussed.
# --timeout 0 is mandatory for Cloud Run to prevent killing long AI reasoning tasks.
CMD exec gunicorn --bind :${PORT:-8080} --workers 1 --threads 8 --timeout 0 index:app