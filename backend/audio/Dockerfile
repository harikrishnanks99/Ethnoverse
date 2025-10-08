# --- Stage 1: Build stage with all dependencies ---
FROM python:3.10-slim as builder

# Set the working directory
WORKDIR /app

# Prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
# Ensure Python output is sent straight to the terminal
ENV PYTHONUNBUFFERED 1

# Install system dependencies that might be needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy the requirements file and install dependencies into the virtual environment
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# --- Stage 2: Final production stage ---
FROM python:3.10-slim

# Set the working directory
WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Make the virtual environment's Python the default one
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user and switch to it for security
RUN addgroup --system app && adduser --system --group app
USER app

# Copy the application code into the container
COPY . .

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application using Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
