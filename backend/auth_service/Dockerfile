# --- Stage 1: Build stage with all dependencies ---
FROM python:3.10-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# --- Stage 2: Final production stage ---
FROM python:3.10-slim

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN addgroup --system app && adduser --system --group app

# --- ADD THESE TWO LINES ---
# Create the directory for the database and set the correct ownership
RUN mkdir -p /app/data
RUN chown -R app:app /app/data
# --- END OF ADDED LINES ---

# Copy the application code WITH the correct ownership
COPY --chown=app:app . .

# Switch to the non-root user
USER app

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]