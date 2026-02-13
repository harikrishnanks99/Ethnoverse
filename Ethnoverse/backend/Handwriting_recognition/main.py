from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import uuid
from datetime import datetime
import json
import aiofiles
from pydantic import BaseModel
from typing import Optional
import shutil
import base64
from PIL import Image
from io import BytesIO

# Set Google Cloud credentials environment variable
if not os.environ.get('GOOGLE_APPLICATION_CREDENTIALS'):
    # Try to find the credentials file
    possible_paths = [
        'google-cloud-key.json',
        '../google-cloud-key.json',
        'credentials/google-cloud-key.json'
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.abspath(path)
            print(f"Set GOOGLE_APPLICATION_CREDENTIALS to: {os.path.abspath(path)}")
            break
    else:
        print("WARNING: Google Cloud credentials file not found. OCR may fail.")

from ocr_service import multi_ocr_predict

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for requests with file backup
request_store = {}
REQUEST_STORE_FILE = "request_store_backup.json"

def load_request_store():
    """Load request store from file if it exists"""
    global request_store
    try:
        if os.path.exists(REQUEST_STORE_FILE):
            with open(REQUEST_STORE_FILE, 'r') as f:
                request_store = json.load(f)
            print(f"Loaded {len(request_store)} requests from backup file")
        else:
            print("No backup file found, starting with empty request store")
    except Exception as e:
        print(f"Failed to load request store backup: {e}")
        request_store = {}

def save_request_store():
    """Save request store to file for persistence"""
    try:
        with open(REQUEST_STORE_FILE, 'w') as f:
            json.dump(request_store, f, indent=2)
        print(f"Saved {len(request_store)} requests to backup file")
    except Exception as e:
        print(f"Failed to save request store backup: {e}")

# Load existing request store on startup
load_request_store()

class SaveRequest(BaseModel):
    request_id: str
    confirmed_text: str
    user_id: Optional[str] = None

def create_image_preview(image_path):
    """Create a base64 preview of the processed image"""
    try:
        with Image.open(image_path) as img:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize for preview (max 400px width)
            img.thumbnail((400, 400), Image.LANCZOS)
            
            # Convert to base64
            buffer = BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            img_data = buffer.getvalue()
            
            return base64.b64encode(img_data).decode('utf-8')
    except Exception as e:
        print(f"Preview generation failed: {e}")
        return None

def save_output(request_id, confirmed_text, original_image_path, original_filename, ocr_result, user_id=None, client_ip=None):
    """Save the OCR results and user confirmation in NLP-ready format"""
    try:
        # Create output directory
        output_dir = "output"
        nlp_dir = "nlp_ready"
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(nlp_dir, exist_ok=True)
        
        timestamp = datetime.now().isoformat()
        
        # Enhanced data structure for NLP processing
        nlp_data = {
            "document_id": request_id,
            "timestamp": timestamp,
            "metadata": {
                "original_filename": original_filename,
                "user_id": user_id,
                "client_ip": client_ip,
                "processing_method": ocr_result.get("method", "Unknown"),
                "confidence_score": ocr_result.get("confidence", 0.0),
                "methods_tried": ocr_result.get("methods_tried", [])
            },
            "content": {
                "raw_text": confirmed_text,
                "preprocessed_text": confirmed_text.strip(),
                "word_count": len(confirmed_text.split()),
                "character_count": len(confirmed_text),
                "line_count": len(confirmed_text.split('\n')),
                "lines": confirmed_text.split('\n')
            },
            "ocr_details": {
                "original_ocr_text": ocr_result.get("text", ""),
                "user_corrections": confirmed_text != ocr_result.get("text", ""),
                "line_data": ocr_result.get("lines", [])
            },
            "nlp_ready": {
                "cleaned_text": ' '.join(confirmed_text.split()),  # Remove extra whitespace
                "sentences": [s.strip() for s in confirmed_text.replace('\n', ' ').split('.') if s.strip()],
                "paragraphs": [p.strip() for p in confirmed_text.split('\n\n') if p.strip()]
            },
            "status": "approved",
            "ready_for_processing": True
        }
        
        # Save NLP-ready JSON
        nlp_json_path = os.path.join(nlp_dir, f"nlp_{request_id}.json")
        with open(nlp_json_path, 'w', encoding='utf-8') as f:
            json.dump(nlp_data, f, indent=2, ensure_ascii=False)
        
        # Save original detailed data
        detailed_data = {
            "request_id": request_id,
            "timestamp": timestamp,
            "original_filename": original_filename,
            "confirmed_text": confirmed_text,
            "ocr_result": ocr_result,
            "user_id": user_id,
            "client_ip": client_ip
        }
        
        json_path = os.path.join(output_dir, f"{request_id}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(detailed_data, f, indent=2, ensure_ascii=False)
        
        # Save plain text for simple processing
        txt_path = os.path.join(nlp_dir, f"text_{request_id}.txt")
        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(confirmed_text)
        
        # Copy the original image to output
        image_output_path = os.path.join(output_dir, f"{request_id}_{original_filename}")
        shutil.copy2(original_image_path, image_output_path)
        
        return {
            "json_file": json_path,
            "nlp_json_file": nlp_json_path,
            "text_file": txt_path,
            "image_file": image_output_path,
            "document_id": request_id
        }
        
    except Exception as e:
        raise Exception(f"Failed to save output: {str(e)}")

@app.post("/api/recognize")
async def recognize(image: UploadFile = File(...)):
    request_id = str(uuid.uuid4())
    
    # Save the uploaded image temporarily
    temp_dir = "temp_images"
    os.makedirs(temp_dir, exist_ok=True)
    image_path = os.path.join(temp_dir, f"{request_id}_{image.filename}")
    
    async with aiofiles.open(image_path, 'wb') as out_file:
        content = await image.read()
        await out_file.write(content)

    # Perform OCR
    try:
        # Use the new cloud OCR service
        ocr_result = multi_ocr_predict(image_path)
        
        # Create image preview
        preview_base64 = create_image_preview(image_path)
        
        # Convert to the expected format
        formatted_result = {
            "text": ocr_result.get("text", ""),
            "lines": ocr_result.get("lines", []),
            "confidence": ocr_result.get("confidence", 0.0),
            "method": ocr_result.get("method", "Cloud-OCR"),
            "methods_tried": ocr_result.get("methods_tried", []),
            "preview_base64": preview_base64
        }
            
    except Exception as e:
        print(f"An error occurred during OCR processing: {e}") # Added for detailed logging
        import traceback
        traceback.print_exc() # Added for full stack trace
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

    # Store request data
    request_store[request_id] = {
        "original_image_path": image_path,
        "original_filename": image.filename,
        "ocr_result": formatted_result
    }
    
    # Save request store to file for persistence
    save_request_store()
    
    print(f"Stored request data for ID: {request_id}")
    print(f"Request store now contains: {list(request_store.keys())}")

    return {
        "request_id": request_id,
        "text": formatted_result["text"],
        "lines": formatted_result["lines"],
        "confidence": formatted_result["confidence"],
        "preview_base64": formatted_result.get("preview_base64"),
        "method": formatted_result["method"],
        "methods_tried": formatted_result.get("methods_tried", [])
    }

@app.post("/api/save")
async def save(request: SaveRequest):
    print(f"=== SAVE REQUEST DEBUG ===")
    print(f"Save request received for ID: {request.request_id}")
    print(f"Available IDs in request_store: {list(request_store.keys())}")
    print(f"Request store size: {len(request_store)}")
    print(f"Current working directory: {os.getcwd()}")
    print(f"Confirmed text length: {len(request.confirmed_text)}")
    print(f"User ID: {request.user_id}")
    
    if request.request_id not in request_store:
        print(f"ERROR: Request ID {request.request_id} not found in request_store")
        print(f"Request store contents: {request_store}")
        raise HTTPException(status_code=404, detail=f"Request ID not found. Available IDs: {list(request_store.keys())}")

    request_data = request_store[request.request_id]
    print(f"Found request data for ID: {request.request_id}")
    print(f"Original image path: {request_data['original_image_path']}")
    print(f"Original filename: {request_data['original_filename']}")
    
    try:
        print(f"Attempting to save output...")
        saved_files = save_output(
            request_id=request.request_id,
            confirmed_text=request.confirmed_text,
            original_image_path=request_data["original_image_path"],
            original_filename=request_data["original_filename"],
            ocr_result=request_data["ocr_result"],
            user_id=request.user_id,
            client_ip="127.0.0.1" # Placeholder
        )
        
        print(f"Successfully saved files: {saved_files}")
        print(f"=== SAVE REQUEST SUCCESS ===")
        
        # Clean up temp file and request store entry
        # os.remove(request_data["original_image_path"])
        # del request_store[request.request_id]

        return {
            "message": "Data saved successfully.",
            "files": saved_files
        }
    except Exception as e:
        print(f"ERROR during save_output: {str(e)}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        print(f"=== SAVE REQUEST FAILED ===")
        raise HTTPException(status_code=500, detail=f"Failed to save data: {str(e)}")


@app.get("/")
def read_root():
    return {"message": "Handwriting Recognition API is running."}

@app.get("/api/debug")
def debug_info():
    """Debug endpoint to check server status"""
    return {
        "server_status": "running",
        "request_store_size": len(request_store),
        "request_ids": list(request_store.keys()),
        "google_credentials_set": bool(os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')),
        "credentials_path": os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', 'Not set')
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
