# Very simple backend for testing
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data
documents = [
    {
        "id": 1,
        "filename": "Zálohová_faktura_250800001.pdf",
        "file_name": "Zálohová_faktura_250800001.pdf",
        "status": "completed",
        "type": "application/pdf",
        "size": "1.2 MB",
        "pages": 2,
        "accuracy": "95%",
        "created_at": "2025-07-21T14:30:00.000000",
        "processed_at": "2025-07-21T14:30:15.000000",
        "processing_time": 2.45,
        "confidence": 0.95,
        "extracted_text": "ZÁLOHOVÁ FAKTURA č. 250800001\nDatum: 21.07.2024\nCelkem k úhradě: 25 678,90 Kč",
        "provider_used": "google_vision",
        "data_source": "gemini",
        "structured_data": {
            "document_type": "faktura",
            "vendor": "Demo Dodavatel s.r.o.",
            "amount": 25678.90,
            "currency": "CZK",
            "date": "2024-07-21",
            "invoice_number": "250800001",
            "ico": "12345678",
            "dic": "CZ12345678"
        }
    },
    {
        "id": 2,
        "filename": "sample_invoice.pdf",
        "file_name": "sample_invoice.pdf",
        "status": "completed",
        "type": "application/pdf",
        "size": "0.8 MB",
        "pages": 1,
        "accuracy": "98.5%",
        "created_at": "2025-07-21T13:15:00.000000",
        "processed_at": "2025-07-21T13:15:08.000000",
        "processing_time": 1.85,
        "confidence": 0.985,
        "extracted_text": "FAKTURA č. 2024-001\nDatum: 21.07.2024\nCelkem k úhradě: 15 678,90 Kč",
        "provider_used": "google_vision",
        "data_source": "gemini",
        "structured_data": {
            "document_type": "faktura",
            "vendor": "Testovací firma s.r.o.",
            "amount": 15678.90,
            "currency": "CZK",
            "date": "2024-07-21",
            "invoice_number": "2024-001"
        }
    },
    {
        "id": 3,
        "filename": "receipt_grocery.jpg",
        "file_name": "receipt_grocery.jpg",
        "status": "completed",
        "type": "image/jpeg",
        "size": "0.5 MB",
        "pages": 1,
        "accuracy": "94.2%",
        "created_at": "2025-07-21T12:00:00.000000",
        "processed_at": "2025-07-21T12:00:05.000000",
        "processing_time": 1.23,
        "confidence": 0.942,
        "extracted_text": "TESCO\nDatum: 21.07.2024\nCelkem: 456,78 Kč",
        "provider_used": "google_vision",
        "data_source": "basic",
        "structured_data": {
            "document_type": "účtenka",
            "vendor": "TESCO",
            "amount": 456.78,
            "currency": "CZK",
            "date": "2024-07-21"
        }
    }
]

@app.get("/")
async def root():
    return {"message": "Simple Backend API", "status": "running"}

@app.get("/documents")
async def get_documents():
    print(f"📄 Returning {len(documents)} documents")
    return documents

@app.get("/documents/{document_id}")
async def get_document(document_id: int):
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    if not document:
        return {"error": "Document not found"}
    
    print(f"📄 Returning document details for: {document_id}")
    return document

if __name__ == "__main__":
    print("🚀 Starting Simple Backend on port 8003...")
    uvicorn.run(app, host="0.0.0.0", port=8003)
