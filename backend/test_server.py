#!/usr/bin/env python3
"""
Test server pro ověření Combined OCR systému
"""

try:
    from fastapi import FastAPI, UploadFile, File, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    import uvicorn
    import tempfile
    import os
    import json
    
    app = FastAPI(title="Askelio Combined OCR Test Server")
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    @app.get("/")
    async def root():
        return {
            "message": "🎉 Askelio Combined OCR Test Server",
            "status": "running",
            "features": [
                "✅ FastAPI server",
                "✅ Google Vision API credentials",
                "✅ Combined OCR ready",
                "🔄 Installing dependencies..."
            ]
        }
    
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "server": "test"}
    
    @app.post("/test-upload")
    async def test_upload(file: UploadFile = File(...)):
        """Test endpoint pro nahrávání souborů"""
        
        # Validate file type
        allowed_types = [
            "application/pdf",
            "image/jpeg", "image/jpg", "image/png",
            "image/gif", "image/bmp", "image/tiff",
            "text/html"
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {file.content_type}"
            )
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            return {
                "status": "success",
                "message": "File uploaded successfully",
                "file_name": file.filename,
                "file_type": file.content_type,
                "file_size": len(content),
                "temp_path": temp_file_path,
                "next_steps": [
                    "Install OCR dependencies",
                    "Test Combined OCR processing",
                    "Return structured results"
                ]
            }
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    @app.get("/test-google-credentials")
    async def test_google_credentials():
        """Test Google Cloud credentials"""
        try:
            if os.path.exists("google-credentials.json"):
                with open("google-credentials.json", "r") as f:
                    credentials = json.load(f)
                
                return {
                    "status": "success",
                    "google_credentials_found": True,
                    "project_id": credentials.get("project_id"),
                    "client_email": credentials.get("client_email"),
                    "message": "Google Vision API credentials are ready"
                }
            else:
                return {
                    "status": "error",
                    "google_credentials_found": False,
                    "message": "Google credentials file not found"
                }
        except Exception as e:
            return {
                "status": "error",
                "google_credentials_found": False,
                "message": str(e)
            }
    
    if __name__ == "__main__":
        print("🚀 Starting Askelio Combined OCR Test Server...")
        print("📍 Server will be available at: http://localhost:8000")
        print("📖 API docs at: http://localhost:8000/docs")
        print("🧪 Test endpoints:")
        print("   • GET  /health")
        print("   • POST /test-upload")
        print("   • GET  /test-google-credentials")
        
        uvicorn.run(app, host="0.0.0.0", port=8000)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Install dependencies: py -m pip install fastapi uvicorn python-multipart")
except Exception as e:
    print(f"❌ Server error: {e}")
