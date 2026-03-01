# 1. Use an official Python runtime as a parent image
# Using 3.12-slim to keep the image small and target the Google Cloud Bonus
FROM python:3.12-slim

# 2. Set environment variables
# Prevents Python from writing pyc files to disk
ENV PYTHONDONTWRITEBYTECODE=1
# Prevents Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1
# Allow OAuth over HTTP for the initial testing phase if needed
ENV OAUTHLIB_INSECURE_TRANSPORT=1

# 3. Set the working directory in the container
WORKDIR /app

# 4. Install system dependencies
# We need build-essential and libpq-dev for psycopg2 (PostgreSQL)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 5. Install Python dependencies
# We copy this first to leverage Docker's cache layers
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6. Copy the rest of the application code
# This copies everything from your local 'backend' folder to the container '/app'
COPY . .

# 7. Expose the port Google Cloud Run expects
# Cloud Run injects the PORT environment variable at runtime
EXPOSE 8080

# 8. Run the application using Gunicorn
# - 'api.index:app' points to your index.py inside the api/ folder
# - --workers 1 is best for Cloud Run (it scales by instances, not workers)
# - --threads 8 handles concurrent AI requests efficiently
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 api.index:app