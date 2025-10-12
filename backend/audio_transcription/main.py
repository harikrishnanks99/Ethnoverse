from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from dotenv import load_dotenv
import transcription_service
import logging
from typing import Dict
from auth import get_current_user # Import the new dependency
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Audio Transcription API",
    description="An API to transcribe audio files using Google Gemini and store results on AWS S3.",
    version="1.0.0"
)


#new changes
origins = [
    "http://your-s3-bucket-website-url.s3-website-us-east-1.amazonaws.com", # Your S3 frontend URL
    "http://localhost:3000", # If you run your frontend locally
    "http://localhost:8080", # Or another local port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Allows specific origins
    # allow_origins=["*"], # Or allow all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

@app.post("/transcribe/", tags=["Transcription"])
async def create_transcription(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user) # Add the auth dependency
):
    """
    Accepts an audio file, transcribes it, and returns the transcription.
    Requires authentication.
    """
    user_id = current_user.get("user_id")
    logger.info(f"User '{user_id}' initiated request to transcribe file: '{file.filename}'")

    if not file or not file.filename:
        logger.warning("Upload request received without a file.")
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    supported_types = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/flac"]
    if file.content_type not in supported_types:
        logger.warning(f"Unsupported file type for user '{user_id}': {file.content_type}.")
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{file.content_type}'. Please upload one of: {', '.join(supported_types)}"
        )

    try:
        transcribed_text = await transcription_service.process_audio_transcription(
            file=file.file,
            filename=file.filename,
            content_type=file.content_type,
            user_id=user_id  # Pass the user_id to the service layer
        )
        
        logger.info(f"Successfully processed file '{file.filename}' for user '{user_id}'.")
        return {
            "filename": file.filename,
            "transcription": transcribed_text
        }
    except HTTPException as e:
        logger.error(f"A known error occurred for user '{user_id}' with file '{file.filename}': {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error for user '{user_id}' with file '{file.filename}'.", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected internal server error occurred.")

@app.get("/", tags=["Health Check"])
async def root():
    logger.info("Health check endpoint was hit.")
    return {"message": "Audio Transcription API is running."}