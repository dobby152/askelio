# Google Vision API integration
import os
from typing import Tuple, Optional
from google.cloud import vision
from google.oauth2 import service_account
import io

from config import settings

class GoogleVisionClient:
    def __init__(self):
        self.client = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Google Vision client with credentials."""
        try:
            if settings.google_application_credentials and os.path.exists(settings.google_application_credentials):
                # Use service account file
                credentials = service_account.Credentials.from_service_account_file(
                    settings.google_application_credentials
                )
                self.client = vision.ImageAnnotatorClient(credentials=credentials)
            else:
                # Try to use default credentials (for production with IAM)
                self.client = vision.ImageAnnotatorClient()
        except Exception as e:
            print(f"Warning: Could not initialize Google Vision client: {e}")
            self.client = None

    def extract_text(self, image_path: str) -> Tuple[str, float]:
        """Extract text from image using Google Vision API."""
        if not self.client:
            return "Google Vision API not configured", 0.0

        try:
            # Read image file
            with io.open(image_path, 'rb') as image_file:
                content = image_file.read()

            image = vision.Image(content=content)

            # Perform text detection
            response = self.client.text_detection(image=image)
            texts = response.text_annotations

            if response.error.message:
                raise Exception(f'Google Vision API error: {response.error.message}')

            if not texts:
                return "", 0.0

            # First annotation contains the full text
            full_text = texts[0].description

            # Calculate confidence (Google Vision doesn't provide confidence for text detection)
            # We'll use a high confidence since Google Vision is generally very accurate
            confidence = 0.95

            return full_text, confidence

        except Exception as e:
            return f"Error: {str(e)}", 0.0

    def extract_document_text(self, image_path: str) -> Tuple[str, float, dict]:
        """Extract text with document structure using Google Vision API."""
        if not self.client:
            return "Google Vision API not configured", 0.0, {}

        try:
            # Read image file
            with io.open(image_path, 'rb') as image_file:
                content = image_file.read()

            image = vision.Image(content=content)

            # Perform document text detection (better for documents)
            response = self.client.document_text_detection(image=image)
            document = response.full_text_annotation

            if response.error.message:
                raise Exception(f'Google Vision API error: {response.error.message}')

            if not document:
                return "", 0.0, {}

            # Extract full text
            full_text = document.text

            # Extract structured information
            structured_data = {
                "pages": len(document.pages),
                "blocks": [],
                "paragraphs": [],
                "words": []
            }

            # Process document structure
            for page in document.pages:
                for block in page.blocks:
                    block_text = ""
                    for paragraph in block.paragraphs:
                        paragraph_text = ""
                        for word in paragraph.words:
                            word_text = ''.join([symbol.text for symbol in word.symbols])
                            paragraph_text += word_text + " "

                            # Store word with confidence
                            word_confidence = sum([symbol.confidence for symbol in word.symbols]) / len(word.symbols) if word.symbols else 0
                            structured_data["words"].append({
                                "text": word_text,
                                "confidence": word_confidence
                            })

                        structured_data["paragraphs"].append(paragraph_text.strip())
                        block_text += paragraph_text

                    structured_data["blocks"].append(block_text.strip())

            # Calculate average confidence from words
            word_confidences = [word["confidence"] for word in structured_data["words"] if word["confidence"] > 0]
            avg_confidence = sum(word_confidences) / len(word_confidences) if word_confidences else 0.95

            return full_text, avg_confidence, structured_data

        except Exception as e:
            return f"Error: {str(e)}", 0.0, {}

# Global instance
google_vision_client = GoogleVisionClient()
