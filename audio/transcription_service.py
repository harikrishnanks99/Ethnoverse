import os
import boto3
import google.generativeai as genai
from botocore.exceptions import NoCredentialsError, ClientError
import logging
from fastapi import HTTPException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Load configuration from environment variables ---
try:
    GEMINI_API_KEY = os.environ['GEMINI_API_KEY']
    S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
    AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
    AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
except KeyError as e:
    logger.error(f"FATAL: Environment variable {e} is not set. The application cannot start.")
    raise SystemExit(f"Error: Missing required environment variable: {e}")

# --- Configure clients ---
genai.configure(api_key=GEMINI_API_KEY)
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# ======================= KEY CHANGE HERE =======================
# The function now accepts the 'content_type' of the file.
async def process_audio_transcription(file, filename: str, content_type: str) -> str:
# =============================================================
    """
    Orchestrates the audio transcription process.
    """
    logger.info(f"Starting transcription process for file: {filename}")

    try:
        file_content = file.read()
    finally:
        file.close()
    
    logger.info(f"Read {len(file_content)} bytes from uploaded file into memory.")

    # --- 1. Upload original audio to S3 ---
    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=filename, Body=file_content)
        logger.info(f"Successfully uploaded original audio '{filename}' to S3 bucket '{S3_BUCKET_NAME}'.")
    except Exception as e:
        logger.error(f"S3 upload failed.", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to upload audio to S3.")

    # --- 2. Transcribe using Gemini API ---
    try:
        logger.info("Sending audio data directly to Google for transcription...")

        # ======================= MAJOR FIX HERE =======================
        # Instead of using upload_file, we create a 'part' object with the
        # file content and its MIME type, and pass it directly.
        audio_part = {
            "mime_type": content_type,
            "data": file_content
        }

        model = genai.GenerativeModel('models/gemini-2.0-flash')
        prompt = "Transcribe the following audio file accurately and clearly to english"
        
        # Pass the prompt and the audio part directly to the model.
        response = model.generate_content([prompt, audio_part])
        # ===============================================================
        
        transcribed_text = response.text.strip()
        
        if not transcribed_text:
             logger.warning(f"Transcription for '{filename}' resulted in an empty response from Gemini.")
             raise HTTPException(status_code=500, detail="Transcription failed: Gemini returned an empty response.")
        
        logger.info("Successfully transcribed audio.")
        
    except Exception as e:
        logger.error(f"GEMINI API FAILED. See traceback below for details.", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred during transcription with the AI service.")

    # --- 3. Save transcription text to S3 ---
    transcription_filename = f"transcripts/{os.path.splitext(filename)[0]}.txt"
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=transcription_filename,
            Body=transcribed_text.encode('utf-8')
        )
        logger.info(f"Successfully saved transcription to '{transcription_filename}' in S3.")
    except Exception as e:
        logger.warning(f"Could not save transcription file to S3. The user still received their text. Error: {e}")

    # --- 4. Return the result ---
    return transcribed_text