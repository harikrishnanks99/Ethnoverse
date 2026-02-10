from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from ocr_service import process_ocr
import os
import shutil

app = FastAPI(title="Ethnoverse Handwriting Service")

# Ensure static directory exists
os.makedirs("static/images", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_handwriting(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        # Save file locally
        file_path = f"static/images/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Read file for OCR
        with open(file_path, "rb") as f:
            content = f.read()
        
        # Process OCR
        result = await process_ocr(content, file.filename, file.content_type, user_id)
        
        # Add file URL to result
        result["file_url"] = f"http://localhost:8003/{file_path}"
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_image")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    try:
        # Save file locally
        file_path = f"static/images/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return only the file URL since we don't need OCR for standard images
        return {
            "status": "success",
            "file_url": f"http://localhost:8003/{file_path}",
            "filename": file.filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok"}
