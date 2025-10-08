from fastapi import FastAPI, UploadFile, File, HTTPException
from dotenv import load_dotenv
import transcription_service
import logging

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

@app.post("/transcribe/", tags=["Transcription"])
async def create_transcription(file: UploadFile = File(...)):
    """
    Accepts an audio file, transcribes it, and returns the transcription.
    """
    logger.info(f"Received request to transcribe file: '{file.filename}' with content type: '{file.content_type}'.")

    if not file or not file.filename:
        logger.warning("Upload request received without a file.")
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    supported_types = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/flac"]
    if file.content_type not in supported_types:
        logger.warning(f"Unsupported file type uploaded: {file.content_type}. Denying request.")
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{file.content_type}'. Please upload one of: {', '.join(supported_types)}"
        )

    try:
        # We now pass the file's content type to the service function.
        transcribed_text = await transcription_service.process_audio_transcription(
            file=file.file,
            filename=file.filename,
            content_type=file.content_type
        )
        
        logger.info(f"Successfully processed and transcribed file '{file.filename}'.")
        return {
            "filename": file.filename,
            "transcription": transcribed_text
        }
    except HTTPException as e:
        logger.error(f"A known error occurred during processing of '{file.filename}': {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"An unexpected server error occurred for file '{file.filename}'.", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected internal server error occurred.")

@app.get("/", tags=["Health Check"])
async def root():
    logger.info("Health check endpoint was hit.")
    return {"message": "Audio Transcription API is running."}