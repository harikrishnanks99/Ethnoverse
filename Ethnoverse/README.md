# Ethnoverse

Ethnoverse is a digital platform designed to preserve implicit cultural knowledge by enabling communities to record, protect, and share valuable generational wisdom. It serves as a bridge between traditional oral histories and modern digital archiving, ensuring that intangible heritage—such as folklore, ecological understanding, and traditional practices—remains accessible for future generations.

## Vision

A vast repository of local knowledge resides with community elders and members, forming the foundation of cultural identity. However, this intangible heritage is often undocumented and at risk of disappearing. Ethnoverse addresses this by providing a cloud-based, AI-integrated platform where fragmented oral and written materials are unified into a structured, searchable archive.

## Key Features

*   **Multimodal Data Ingestion**:
    *   **Audio Transcription**: Automated conversion of spoken English audio into searchable text.
    *   **Handwriting Recognition**: Digitization of handwritten documents (journals, manuscripts) into machine-readable text.
*   **AI Community Administrator**:
    *   An autonomous AI agent oversees platform governance, ensuring uploaded content aligns with community rules and interests.
    *   Solves the "successor problem" by maintaining the community for the long term, preventing knowledge loss due to administrative dormant periods.
    *   Verifies content quality and adherence to guidelines before publication.
*   **Knowledge Graph & RAG**:
    *   **Entity Extraction**: LLMS extract key concepts, individuals, and locations.
    *   **Knowledge Graph**: Organizes data into a graph-based structure to highlight relationships and context.
    *   **Retrieval-Aghented Generation (RAG)**: Enhance search capabilities, allowing users to query the archive naturally and retrieve accurate context-aware information.
*   **Persistent Archival**: Cloud-native architecture designed for long-term data preservation.

## Architecture

The project follows a **Microservices Architecture** orchestrating various specialized services:

*   **Frontend**: Built with **HTML, CSS, and Vanilla JavaScript** for a lightweight and responsive user interface.
*   **Backend**: Powered by **Python and FastAPI**. Each core function is isolated in its own service:
    *   `auth_service`: User authentication and management.
    *   `audio_transcription`: Handles audio processing and text conversion.
    *   `Handwriting_recognition`: OCR and handwriting digitization.
*   **Infrastructure**:
    *   **Docker & Docker Compose**: Containerization of all services for consistent deployment and easy scalability.
    *   **Nginx**: Acts as a reverse proxy / API gateway to route requests to the appropriate backend services.

## Repository Structure

```
Ethnoverse/
├── Frontend/                 # Web interface (HTML/CSS/JS)
│   ├── home/                 # Landing page
│   ├── dash/                 # User dashboard
│   ├── upload/               # Content upload interface
│   └── ...
├── backend/                  # Backend Microservices
│   ├── auth_service/         # Authentication Logic (FastAPI)
│   ├── audio_transcription/  # Speech-to-Text Service (FastAPI)
│   ├── Handwriting_recognition/ # OCR Service (FastAPI)
│   └── nginx/                # Proxy Configuration
└── docker-compose.yml        # Orchestration for all services
```

## Work Completed So Far

The following components and features have been implemented and are currently functional:

### Backend Services
*   **Authentication Service (`auth_service`)**:
    *   User registration and login functionality.
    *   JWT-based secure authentication.
    *   Database integration for storing user credentials.
*   **Audio Transcription Service (`audio_transcription`)**:
    *   Service to handle audio file uploads.
    *   Integration with transcription logic to convert speech to text.
*   **Handwriting Recognition Service (`Handwriting_recognition`)**:
    *   OCR capabilities to process image uploads.
    *   Conversion of handwritten images into digital text.
*   **Infrastructure**:
    *   **Docker Orchestration**: `docker-compose.yml` is set up to run all services (Auth, Audio, Handwriting, Nginx) simultaneously.
    *   **API Gateway**: Nginx is configured to route traffic to the respective backend services.

### Frontend
*   **User Interface**:
    *   **Landing Page**: A welcoming home page introducing the project.
    *   **Dashboard**: User area for managing content.
    *   **Upload Interface**: Functional UI for uploading audio and image files for processing.

## Getting Started

### Prerequisites

*   Docker and Docker Compose installed on your machine.

### running the Application

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Ethnoverse-readme/Ethnoverse
    ```

2.  **Build and Start Services**:
    Use Docker Compose to spin up the entire stack.
    ```bash
    docker-compose up --build
    ```

3.  **Access the Application**:
    *   Frontend: Open your browser and navigate to `http://localhost:80` (or the configured port).
    *   API Documentation: Individual services can be accessed at their respective ports (e.g., `http://localhost:8000/docs` for auth, etc., check `docker-compose.yml` for specific port mappings).

## Future Roadmap

*   Language support expansion for non-English audio.
*   Advanced graph visualization tools for researchers.
*   Integration with decentralized storage solutions for added permanence.
