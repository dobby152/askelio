#!/usr/bin/env python3
"""
Test endpoints for Google Vision API testing via web interface
"""
import os
import time
import tempfile
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

load_dotenv()

app = FastAPI(title="Google Vision Test API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TestRequest(BaseModel):
    test_type: str
    test_comprehensive: bool = False

@app.get("/")
async def root():
    """Serve the test HTML page"""
    return FileResponse("test_vision_web.html")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check Google Vision API availability
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        google_vision_available = bool(api_key)
        
        if google_vision_available:
            try:
                from google.cloud import vision
                client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
                google_vision_available = True
            except Exception:
                google_vision_available = False
        
        return {
            "status": "healthy",
            "version": "1.0.0",
            "uptime": "running",
            "google_vision_available": google_vision_available,
            "api_key_configured": bool(api_key)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test/vision-pdf")
async def test_vision_pdf(request: TestRequest):
    """Test Google Vision API with PDF"""
    start_time = time.time()
    
    try:
        from google.cloud import vision
        
        # Get API key
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Vision API key not configured")
        
        # Initialize client
        client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
        
        # Create test PDF content
        test_pdf_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(FAKTURA 2025-001 Celkem: 15,000 CZK) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
299
%%EOF"""
        
        # Process with Google Vision
        image = vision.Image(content=test_pdf_content)
        response = client.document_text_detection(image=image)
        
        if response.error.message:
            raise HTTPException(status_code=500, detail=f"Google Vision error: {response.error.message}")
        
        extracted_text = response.full_text_annotation.text if response.full_text_annotation else ""
        processing_time = time.time() - start_time
        
        # Calculate confidence (mock for PDF)
        confidence = 0.95 if extracted_text.strip() else 0.0
        
        return {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "processing_time": round(processing_time, 2),
            "confidence": confidence,
            "document_type": "PDF",
            "api_used": "Google Vision API"
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "processing_time": round(processing_time, 2)
        }

@app.post("/test/vision-image")
async def test_vision_image(file: UploadFile = File(...)):
    """Test Google Vision API with uploaded image"""
    start_time = time.time()
    
    try:
        from google.cloud import vision
        
        # Get API key
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Vision API key not configured")
        
        # Initialize client
        client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
        
        # Read uploaded file
        content = await file.read()
        
        # Process with Google Vision
        image = vision.Image(content=content)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise HTTPException(status_code=500, detail=f"Google Vision error: {response.error.message}")
        
        # Extract text
        texts = response.text_annotations
        extracted_text = texts[0].description if texts else ""
        
        # Calculate confidence
        confidence = 0.0
        if texts:
            confidences = []
            for text in texts[1:]:  # Skip first (full text)
                if hasattr(text, 'confidence'):
                    confidences.append(text.confidence)
            confidence = sum(confidences) / len(confidences) if confidences else 0.9
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "extracted_text": extracted_text.strip(),
            "processing_time": round(processing_time, 2),
            "confidence": round(confidence, 2),
            "file_name": file.filename,
            "file_size": len(content),
            "api_used": "Google Vision API"
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "processing_time": round(processing_time, 2)
        }

@app.post("/test/complete-pipeline")
async def test_complete_pipeline(request: TestRequest):
    """Test complete OCR pipeline"""
    start_time = time.time()
    steps_completed = 0
    total_steps = 5
    
    try:
        # Step 1: Initialize Google Vision API
        from google.cloud import vision
        api_key = os.getenv('GOOGLE_VISION_API_KEY') or os.getenv('GOOGLE_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="Google Vision API key not configured")
        
        client = vision.ImageAnnotatorClient(client_options={"api_key": api_key})
        steps_completed += 1
        
        # Step 2: Create test document
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        # Create test image with invoice data
        img = Image.new('RGB', (600, 400), color='white')
        draw = ImageDraw.Draw(img)
        
        try:
            font = ImageFont.load_default()
        except:
            font = None
        
        # Draw invoice content
        draw.text((50, 50), "FAKTURA č. 2025-001", fill='black', font=font)
        draw.text((50, 100), "Dodavatel: Test s.r.o.", fill='black', font=font)
        draw.text((50, 150), "Odběratel: Zákazník s.r.o.", fill='black', font=font)
        draw.text((50, 200), "Celkem k úhradě: 25,000 CZK", fill='black', font=font)
        draw.text((50, 250), "Datum splatnosti: 2025-02-28", fill='black', font=font)
        draw.text((50, 300), "DPH 21%: 5,250 CZK", fill='black', font=font)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_content = img_bytes.getvalue()
        steps_completed += 1
        
        # Step 3: OCR processing
        image = vision.Image(content=img_content)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Google Vision error: {response.error.message}")
        
        texts = response.text_annotations
        extracted_text = texts[0].description if texts else ""
        steps_completed += 1
        
        # Step 4: AI structuring (mock)
        structured_data = {
            "invoice_number": "2025-001",
            "supplier": "Test s.r.o.",
            "customer": "Zákazník s.r.o.",
            "total_amount": 25000,
            "currency": "CZK",
            "due_date": "2025-02-28",
            "vat_amount": 5250,
            "vat_rate": 21
        }
        steps_completed += 1
        
        # Step 5: Validation
        validation_results = {
            "text_extracted": bool(extracted_text.strip()),
            "invoice_number_found": "2025-001" in extracted_text,
            "amount_found": "25,000" in extracted_text or "25000" in extracted_text,
            "supplier_found": "Test s.r.o." in extracted_text,
            "due_date_found": "2025-02-28" in extracted_text
        }
        steps_completed += 1
        
        processing_time = time.time() - start_time
        success_rate = (sum(validation_results.values()) / len(validation_results)) * 100
        
        return {
            "success": True,
            "steps_completed": steps_completed,
            "total_steps": total_steps,
            "total_time": round(processing_time, 2),
            "success_rate": round(success_rate, 1),
            "details": {
                "extracted_text": extracted_text.strip(),
                "structured_data": structured_data,
                "validation": validation_results,
                "image_size": len(img_content),
                "api_used": "Google Vision API"
            }
        }
        
    except Exception as e:
        processing_time = time.time() - start_time
        return {
            "success": False,
            "error": str(e),
            "steps_completed": steps_completed,
            "total_steps": total_steps,
            "processing_time": round(processing_time, 2)
        }

if __name__ == "__main__":
    print("🚀 Starting Google Vision Test Server...")
    print("📄 Test page will be available at: http://localhost:8002")
    uvicorn.run(app, host="0.0.0.0", port=8002)
