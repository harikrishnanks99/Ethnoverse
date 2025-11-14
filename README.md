# Multi-Service Audio Transcription API

This project is a secure, scalable, and robust backend system for audio transcription, built using a modern microservice architecture. It features a dedicated authentication service for user management and a separate transcription service that leverages Google's Gemini API for state-of-the-art speech-to-text conversion. All user data is securely stored in a private AWS S3 bucket.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Setup and Installation](#project-setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [API Usage and Testing](#api-usage-and-testing)
  - [Step 1: Register a New User](#step-1-register-a-new-user)
  - [Step 2: Log In to Get an Access Token](#step-2-log-in-to-get-an-access-token)
  - [Step 3: Transcribe an Audio File](#step-3-transcribe-an-audio-file)
- [Challenges and Key Learnings](#challenges-and-key-learnings)

## Features

- **Microservice Architecture:** Clean separation of concerns with a dedicated Authentication Service and Transcription Service.
- **Secure User Authentication:** JWT (JSON Web Token) based authentication for stateless and secure API access.
- **Password Hashing:** User passwords are securely hashed using bcrypt before being stored.
- **AI-Powered Transcription:** Integrates with Google's Gemini API for highly accurate and fast audio-to-text conversion.
- **Secure File Storage:** All uploaded audio files and their transcriptions are stored in a private, user-specific folder in AWS S3, ensuring data isolation and security.
- **Containerized Application:** Fully containerized using Docker and orchestrated with Docker Compose for easy setup and consistent environments.
- **Interactive API Documentation:** Each service includes auto-generated, interactive API documentation via FastAPI and Swagger UI.

## Architecture

The application is composed of two primary microservices that run in separate Docker containers:

1.  **Authentication Service (`auth_service`)**:
    - Runs on port `8001`.
    - Manages user registration (`/register`) and login (`/login`).
    - Handles password hashing and storage in a persistent SQLite database.
    - Generates and signs JWT access tokens upon successful login.

2.  **Transcription Service (`audio_transcription`)**:
    - Runs on port `8000`.
    - Exposes a protected endpoint (`/transcribe`) for audio processing.
    - Validates JWTs received in the `Authorization` header on every request.
    - Interacts with the Gemini API to perform transcription.
    - Uploads the original audio and the resulting text transcript to a user-specific folder in an AWS S3 bucket.

## Technology Stack

- **Backend Framework:** FastAPI
- **Authentication:** PyJWT for token generation/validation, Passlib with bcrypt for password hashing.
- **Database:** SQLite with SQLAlchemy ORM.
- **Cloud Services:**
  - **Google Gemini API** for AI-powered transcription.
  - **AWS S3** for secure file storage.
- **Containerization:** Docker & Docker Compose
- **API Testing:** Postman or interactive Swagger UI.

## Project Setup and Installation

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed and running.
- An AWS account with an S3 bucket created. You will need your `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- A Google Cloud account with the Gemini API enabled. You will need your `GEMINI_API_KEY`.

### Environment Configuration

Before running the application, you must configure the environment variables.

1.  **Navigate to `auth_service/`** and create a file named `.env`. Add the following content, replacing the placeholder values:

    ```ini
    # file: auth_service/.env

    DATABASE_URL="sqlite:///./data/auth.db"

    # Generate a strong, random secret key with: openssl rand -hex 32
    JWT_SECRET_KEY="your-super-secret-and-long-random-string-for-jwt"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    ```

2.  **Navigate to `audio_transcription/`** and create a file named `.env`. Add the following content, replacing the placeholder values:

    ```ini
    # file: audio_transcription/.env

    # Gemini and AWS Credentials
    GEMINI_API_KEY="your-google-gemini-api-key"
    S3_BUCKET_NAME="your-s3-bucket-name"
    AWS_ACCESS_KEY_ID="your-aws-access-key"
    AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
    AWS_REGION="us-east-1"

    # JWT Settings (must be identical to the auth_service)
    JWT_SECRET_KEY="your-super-secret-and-long-random-string-for-jwt"
    ALGORITHM="HS256"
    ```

### Running the Application

From the root `backend/` directory, run the following command to build and start the services:

```bash
docker-compose up --build
