import os
from google.cloud import vision
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)

async def process_ocr(file_content: bytes, filename: str, content_type: str, user_id: str):
    """
    Processes an image/PDF file to extract handwritten text using Google Cloud Vision.
    Then returns the extracted text.
    """
    try:
        # Initialize the Google Cloud Vision client
        # It automatically picks up credentials from GOOGLE_APPLICATION_CREDENTIALS env var
        client = vision.ImageAnnotatorClient()
        
        image = vision.Image(content=file_content)
        
        # Use document text detection for handwriting which is better for dense text
        logging.info(f"Processing OCR for file: {filename}")
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Google Cloud Vision API Error: {response.error.message}")
            
        full_text = ""
        if response.full_text_annotation:
            full_text = response.full_text_annotation.text
            logging.info("Successfully extracted text from image")
        else:
            logging.warning("No text detected in image")

        return {
            "ocr_text": full_text.strip()
        }

    except Exception as e:
        logging.error(f"OCR process failed: {e}")
        raise e
