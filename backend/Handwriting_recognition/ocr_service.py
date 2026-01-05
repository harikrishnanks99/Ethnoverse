"""
OCR Service using Google Cloud Vision API
This module provides handwriting recognition using Google Cloud Vision API only.
"""

import logging
import os
from google.cloud import vision
import io

# Configure logging
logging.basicConfig(level=logging.INFO)


def google_cloud_vision_ocr(image_path):
    """
    Extract handwritten text using Google Cloud Vision API
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        dict: OCR result containing text, confidence, words, and error information
    """
    try:
        # Initialize the Google Cloud Vision client
        client = vision.ImageAnnotatorClient()
        
        # Load the image file
        with io.open(image_path, 'rb') as image_file:
            content = image_file.read()
        
        image = vision.Image(content=content)
        
        # Use document text detection for handwriting
        response = client.document_text_detection(image=image)
        
        # Check for errors in the response
        if response.error.message:
            raise Exception(response.error.message)
        
        # Extract full text
        if response.full_text_annotation:
            full_text = response.full_text_annotation.text
            confidence = 0.9  # Google Vision doesn't provide overall confidence
            
            # Extract individual words with their bounding boxes
            words_info = []
            for page in response.full_text_annotation.pages:
                for block in page.blocks:
                    for paragraph in block.paragraphs:
                        for word in paragraph.words:
                            word_text = ''.join([symbol.text for symbol in word.symbols])
                            # Google Vision provides confidence at block level
                            word_confidence = block.confidence if hasattr(block, 'confidence') else 0.9
                            words_info.append({
                                "text": word_text,
                                "confidence": float(word_confidence)
                            })
            
            logging.info(f"Successfully extracted {len(words_info)} words from image")
            
            return {
                "text": full_text.strip(),
                "confidence": float(confidence),
                "words": words_info,
                "method": "Google Cloud Vision API",
                "error": None
            }
        else:
            logging.warning("No text detected in image")
            return {
                "text": "",
                "confidence": 0.0,
                "words": [],
                "method": "Google Cloud Vision API",
                "error": "No text detected"
            }
            
    except Exception as e:
        error_msg = f"Google Cloud Vision API error: {str(e)}"
        logging.error(error_msg)
        return {
            "text": "",
            "confidence": 0.0,
            "words": [],
            "method": "Google Cloud Vision API",
            "error": error_msg
        }


def multi_ocr_predict(image_path):
    """
    Main OCR prediction function using Google Cloud Vision API
    
    Args:
        image_path (str): Path to the image file
        
    Returns:
        dict: Comprehensive OCR result with text, confidence, and metadata
    """
    
    # Use Google Cloud Vision API
    logging.info(f"Processing image: {image_path}")
    logging.info("Using Google Cloud Vision API for handwriting recognition...")
    
    gcp_result = google_cloud_vision_ocr(image_path)
    
    # Check if Google Cloud Vision succeeded
    if gcp_result["text"] and gcp_result["text"].strip() and not gcp_result["error"]:
        # Success - format the result
        result = {
            "text": gcp_result["text"],
            "raw_text": gcp_result["text"],
            "corrected_text": gcp_result["text"],
            "confidence": gcp_result["confidence"],
            "method": "Google Cloud Vision API",
            "ocr_engine": "Google Cloud Vision",
            "methods_tried": ["Google Cloud Vision API"],
            "primary_method": "Google Cloud Vision",
            "words": gcp_result.get("words", []),
            "lines": [
                {
                    "line": gcp_result["text"],
                    "confidence": gcp_result["confidence"]
                }
            ] if gcp_result["text"] else []
        }
        
        logging.info("Google Cloud Vision successfully extracted text")
        logging.info(f"Text length: {len(result['text'])} characters")
        logging.info(f"Confidence: {result['confidence']:.2%}")
        
        return result
    
    # Google Cloud Vision failed
    error_msg = gcp_result.get('error', 'Unknown error')
    logging.error(f"Google Cloud Vision failed: {error_msg}")
    
    # Return error result
    return {
        "text": "",
        "raw_text": "",
        "corrected_text": "",
        "confidence": 0.0,
        "method": "Failed",
        "ocr_engine": "Google Cloud Vision",
        "methods_tried": ["Google Cloud Vision API (failed)"],
        "error": f"OCR failed: {error_msg}",
        "lines": []
    }
