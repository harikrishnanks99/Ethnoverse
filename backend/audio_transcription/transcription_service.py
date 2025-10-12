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

# Load required environment variables for Gemini and AWS
try:
    GEMINI_API_KEY = os.environ['GEMINI_API_KEY']
    S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
    AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
    AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
    AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
except KeyError as e:
    logger.error(f"FATAL: Environment variable {e} is not set. The application cannot start.")
    raise SystemExit(f"Error: Missing required environment variable: {e}")

# Configure the clients
genai.configure(api_key=GEMINI_API_KEY)
s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# The rest of the file (the process_audio_transcription function) remains exactly the same.
async def process_audio_transcription(file, filename: str, content_type: str, user_id: str) -> str:
    # ... (function implementation is unchanged)
    logger.info(f"Starting transcription process for file: {filename} for user: {user_id}")

    # Define user-specific paths
    s3_audio_key = f"private/{user_id}/audio/{filename}"
    s3_transcript_key = f"private/{user_id}/transcripts/{os.path.splitext(filename)[0]}.txt"

    try:
        file_content = file.read()
    finally:
        file.close()
    
    logger.info(f"Read {len(file_content)} bytes from uploaded file.")

    # Upload original audio to user's private S3 folder
    try:
        s3_client.put_object(Bucket=S3_BUCKET_NAME, Key=s3_audio_key, Body=file_content)
        logger.info(f"Uploaded audio '{s3_audio_key}' to S3 for user '{user_id}'.")
    except Exception as e:
        logger.error(f"S3 upload failed for user '{user_id}'.", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload audio to S3.")

    # Transcribe using Gemini API
    try:
        logger.info("Sending audio data directly to Google for transcription...")

        audio_part = {
            "mime_type": content_type,
            "data": file_content
        }

        model = genai.GenerativeModel('models/gemini-2.0-flash')
        prompt = "Transcribe the following audio file accurately and clearly to english"
        
        response = model.generate_content([prompt, audio_part])
        
        transcribed_text = response.text.strip()
        
        if not transcribed_text:
             logger.warning(f"Empty transcription for '{filename}' for user '{user_id}'.")
             raise HTTPException(status_code=500, detail="Transcription failed: Gemini returned an empty response.")
        
        logger.info(f"Successfully transcribed audio for user '{user_id}'.")
        
    except Exception as e:
        logger.error(f"GEMINI API FAILED for user '{user_id}'.", exc_info=True)
        raise HTTPException(status_code=500, detail="Error during transcription with the AI service.")

    # Save transcription text to user's private S3 folder
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_transcript_key,
            Body=transcribed_text.encode('utf-8')
        )
        logger.info(f"Saved transcription to '{s3_transcript_key}' in S3 for user '{user_id}'.")
    except Exception as e:
        logger.warning(f"Could not save transcript to S3 for user '{user_id}'. Error: {e}")

    return transcribed_text