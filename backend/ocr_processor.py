# OCR processing module
import os
import cv2
import pytesseract
import json
from PIL import Image
from typing import Dict, Any, Optional, Tuple
from celery import Celery
from sqlalchemy.orm import Session
from datetime import datetime
from decimal import Decimal
import re
import logging

from database import SessionLocal
from models import Document, DocumentStatus, User, CreditTransaction, TransactionType
from config import settings
from google_vision import google_vision_client
from pdf_processor import pdf_to_images, extract_text_from_pdf, cleanup_temp_images

# Configure Celery
celery_app = Celery("askelio", broker=settings.redis_url, backend=settings.redis_url)

# Configure logging
logger = logging.getLogger('ocr_processor')

# Configure Tesseract (adjust path for your system)
# On Windows, uncomment and adjust the path:
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# On Linux/Docker, Tesseract should be in PATH

def preprocess_image(image_path: str) -> str:
    """Preprocess image for better OCR results."""
    # Read image
    img = cv2.imread(image_path)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply noise reduction
    denoised = cv2.medianBlur(gray, 3)

    # Apply thresholding
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Save preprocessed image
    preprocessed_path = image_path.replace('.', '_preprocessed.')
    cv2.imwrite(preprocessed_path, thresh)

    return preprocessed_path

def extract_text_tesseract(file_path: str) -> Tuple[str, float]:
    """Extract text using Tesseract OCR."""
    try:
        if file_path.lower().endswith('.pdf'):
            # Try to extract text directly from PDF first
            pdf_text, pdf_confidence = extract_text_from_pdf(file_path)

            if pdf_confidence > 0.7:  # Good text extraction
                return pdf_text, pdf_confidence
            else:
                # Convert PDF to images and OCR each page
                image_paths = pdf_to_images(file_path)
                if not image_paths:
                    return "Could not process PDF", 0.0

                all_text = []
                all_confidences = []

                for image_path in image_paths:
                    # Preprocess and OCR each page
                    preprocessed_path = preprocess_image(image_path)

                    data = pytesseract.image_to_data(preprocessed_path, output_type=pytesseract.Output.DICT)
                    page_text = pytesseract.image_to_string(preprocessed_path, lang='ces+eng')

                    # Calculate page confidence
                    confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
                    page_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0

                    all_text.append(page_text)
                    all_confidences.append(page_confidence)

                    # Clean up preprocessed image
                    if os.path.exists(preprocessed_path):
                        os.remove(preprocessed_path)

                # Clean up temporary PDF images
                cleanup_temp_images(image_paths)

                # Combine results
                text = "\n".join(all_text)
                confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0

                return text, confidence
        else:
            # Regular image processing
            preprocessed_path = preprocess_image(file_path)

            # Extract text with confidence
            data = pytesseract.image_to_data(preprocessed_path, output_type=pytesseract.Output.DICT)
            text = pytesseract.image_to_string(preprocessed_path, lang='ces+eng')

            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            confidence = sum(confidences) / len(confidences) / 100 if confidences else 0

            # Clean up
            if os.path.exists(preprocessed_path):
                os.remove(preprocessed_path)

            return text, confidence

    except Exception as e:
        return f"Error: {str(e)}", 0.0

def extract_text_ai(file_path: str) -> Tuple[str, float]:
    """Extract text using AI OCR (Google Vision API)."""
    try:
        # Use Google Vision API for better accuracy
        text, confidence, _ = google_vision_client.extract_document_text(file_path)
        return text, confidence

    except Exception as e:
        return f"Error: {str(e)}", 0.0

def extract_structured_data(text: str) -> Dict[str, Any]:
    """Extract structured data from OCR text."""
    data = {
        "invoice_number": None,
        "date": None,
        "total_amount": None,
        "supplier_name": None,
        "supplier_ico": None,
        "supplier_dic": None,
        "customer_name": None,
        "items": [],
        "raw_text": text
    }

    # Simple regex patterns for Czech invoices
    patterns = {
        "invoice_number": r"(?:faktura|invoice|č\.|number)[\s:]*([A-Z0-9\-/]+)",
        "date": r"(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})",
        "total_amount": r"(?:celkem|total|suma)[\s:]*(\d+[,.]?\d*)",
        "ico": r"IČO?[\s:]*(\d{8})",
        "dic": r"DIČ[\s:]*([A-Z]{2}\d+)"
    }

    for field, pattern in patterns.items():
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            data[field] = match.group(1).strip()

    return data

def calculate_confidence_score(tesseract_conf: float, ai_conf: float, use_ai: bool) -> float:
    """Calculate overall confidence score."""
    if use_ai:
        return ai_conf
    else:
        return tesseract_conf

@celery_app.task
def process_document_async(document_id: str, file_path: str):
    """Async task to process document with OCR."""
    logger.info(f"Starting OCR processing for document {document_id}")
    db = SessionLocal()

    try:
        # Get document
        document = db.query(Document).filter(Document.id == document_id).first()
        if not document:
            logger.error(f"Document {document_id} not found")
            return

        # Get user
        user = db.query(User).filter(User.id == document.user_id).first()
        if not user:
            logger.error(f"User {document.user_id} not found for document {document_id}")
            return

        logger.info(f"Processing document {document.file_name} for user {user.email}")

        # Extract text with Tesseract
        tesseract_text, tesseract_conf = extract_text_tesseract(file_path)

        # Determine if AI OCR is needed
        use_ai = tesseract_conf < settings.tesseract_confidence_threshold
        ai_text, ai_conf = "", 0.0
        processing_cost = Decimal('0.00')

        if use_ai and user.credit_balance >= settings.ai_ocr_cost:
            # Use AI OCR and deduct credit
            ai_text, ai_conf = extract_text_ai(file_path)
            processing_cost = Decimal(str(settings.ai_ocr_cost))

            # Deduct credit
            user.credit_balance -= processing_cost

            # Create transaction record
            transaction = CreditTransaction(
                user_id=user.id,
                document_id=document.id,
                amount=-processing_cost,
                type=TransactionType.usage,
                description=f"AI OCR zpracování dokumentu {document.file_name}"
            )
            db.add(transaction)

        # Choose best result
        if use_ai and ai_conf > tesseract_conf:
            final_text = ai_text
            final_confidence = ai_conf
        else:
            final_text = tesseract_text
            final_confidence = tesseract_conf

        # Extract structured data
        structured_data = extract_structured_data(final_text)

        # Update document
        document.raw_tesseract_data = {
            "text": tesseract_text,
            "confidence": tesseract_conf
        }

        if use_ai:
            document.raw_ai_data = {
                "text": ai_text,
                "confidence": ai_conf
            }

        document.final_extracted_data = structured_data
        document.confidence_score = final_confidence
        document.processing_cost = processing_cost
        document.status = DocumentStatus.completed
        document.completed_at = datetime.utcnow()

        db.commit()

        # Clean up file
        if os.path.exists(file_path):
            os.remove(file_path)

    except Exception as e:
        # Update document with error
        document.status = DocumentStatus.failed
        document.error_message = str(e)
        db.commit()

    finally:
        db.close()
