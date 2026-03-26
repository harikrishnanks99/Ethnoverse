# Ethnoverse

Ethnoverse is a digital platform designed to preserve implicit cultural knowledge by enabling communities to record, protect, and share valuable generational wisdom. It serves as a bridge between traditional oral histories and modern digital archiving, ensuring that intangible heritage—such as folklore, ecological understanding, and traditional practices—remains accessible for future generations.

---

## 📖 Vision

A vast repository of local knowledge resides with community elders and members, forming the foundation of cultural identity. However, this intangible heritage is often undocumented and at risk of disappearing. Ethnoverse addresses this by providing a cloud-based, AI-integrated platform where fragmented oral and written materials are unified into a structured, searchable, and interactive archive.

---

## ✨ Key Features

*   **Multimodal Data Ingestion**:
    *   **Audio Transcription**: Automated conversion of spoken audio into searchable text.
    *   **Handwriting Recognition**: Digitization of handwritten documents (journals, manuscripts, etc.) into machine-readable text using OCR.
*   **AI Community Administrator**:
    *   An autonomous AI agent oversees platform governance, ensuring uploaded content aligns with community rules and interests.
    *   Solves the "successor problem" by maintaining the community for the long term, preventing knowledge loss due to administrative dormant periods.
    *   Verifies content quality and adherence to guidelines before publication.
*   **Knowledge Graph & Semantic Search (GraphRAG)**:
    *   **Entity Extraction**: Utilizes **LangChain** and **Gemini LLMs** (`langchain-google-genai`) to extract key concepts, individuals, locations, and cultural artifacts from the content.
    *   **Knowledge Graph**: Organizes data into a **Neo4j** graph database, leveraging `langgraph` to construct advanced reasoning workflows that highlight deep relationships and cultural context.
    *   **Hybrid Search**: Combines semantic vector search (**ChromaDB** with `fastembed` embeddings) with GraphRAG to orchestrate context-aware, highly accurate, and complex traversal queries.
*   **Persistent Archival**: Cloud-native architecture designed for robust and long-term data preservation.

---

## 🏗️ Architecture & Tech Stack

The project follows a **Microservices Architecture** orchestrating various specialized services:

### **Frontend**
*   **Framework**: React (Vite-based)
*   **Routing**: React Router DOM
*   **Visualizations**: `react-force-graph-2d` / `three` for interactive knowledge graph exploration.

### **Backend Systems (Microservices)**
Powered by **Python 3.x** and **FastAPI** (`uvicorn` ASGI server). Each core capability is isolated into specialized microservices communicating via REST:
*   `auth_service`: Secures endpoints and issues stateless JWTs (`PyJWT`) for robust API authentication.
*   `transcription_service`: Integrates with **Google Generative AI** (`google-generativeai`) and **Boto3** to automate audio-to-text processing for incoming media pipelines.
*   `handwriting_service`: Employs **Google Cloud Vision API** (`google-cloud-vision`) to run advanced OCR on scanned artifacts, transforming handwritten journals into queryable data.
*   `ai_agent`: The core intelligence layer composed using **LangChain** and **LangGraph**. It manages stateful GraphRAG workflows, semantic search execution (via **ChromaDB**), Neo4j graph ingestion, and integrations with **Google Gemini** models.

### **Infrastructure & Data Stores**
*   **Graph Database**: Neo4j
*   **Vector Database**: ChromaDB
*   **Caching/Message Broker**: Redis
*   **Containerization**: Docker & Docker Compose

---

## 📂 Repository Structure

```text
Ethnoverse/
├── Ethnoverse/
│   ├── frontend-app/           # React Frontend (Vite)
│   │   ├── src/                # Frontend source code
│   │   └── package.json        
│   │
│   └── backend/                # Backend Microservices
│       ├── auth_service/       # Authentication Service (FastAPI)
│       ├── audio_transcription/# Speech-to-Text Service (FastAPI)
│       ├── handwriting_service/# OCR Service (FastAPI)
│       ├── ai_agent/           # Core AI & GraphRAG Service (FastAPI)
│       ├── docker-compose.yml  # Local Development Orchestration
│       └── docker-compose.prod.yml # Production Orchestration
```

---

## 🚀 Getting Started

### Prerequisites

*   [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine.
*   Node.js (optional, for running the frontend separately).
*   API Keys for Google Cloud (for Gemini LLM and OCR, configured in `.env` files).

### Running the Application (Docker)

The easiest way to run the entire Ethnoverse stack is utilizing the provided Docker Compose configuration.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd Ethnoverse
    ```

2.  **Environment Variables**:
    *   Navigate to the respective microservice directories (`backend/auth_service`, `backend/ai_agent`, `backend/audio_transcription`, etc.) and set up the necessary `.env` files.
    *   Ensure required credentials (e.g., `google-cloud-key.json` for GCP) are placed as defined in the compose file.

3.  **Build and Start Services**:
    From the `backend` directory, spin up the complete stack:
    ```bash
    cd Ethnoverse/backend
    docker-compose up --build
    ```

4.  **Access the Application**:
    *   **Frontend**: `http://localhost:5173`
    *   **Auth API Docs**: `http://localhost:8001/docs`
    *   **Audio Transcription API Docs**: `http://localhost:8000/docs`
    *   **AI Agent API Docs**: `http://localhost:8002/docs`
    *   **Handwriting Service API Docs**: `http://localhost:8003/docs`
    *   **Neo4j Browser**: `http://localhost:7474`

---

