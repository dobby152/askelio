# PDF processing utilities
import os
import tempfile
from typing import List, Tuple
from PIL import Image
import fitz  # PyMuPDF
import io

def pdf_to_images(pdf_path: str, dpi: int = 200) -> List[str]:
    """Convert PDF pages to images for OCR processing."""
    image_paths = []

    try:
        # Open PDF
        pdf_document = fitz.open(pdf_path)

        for page_num in range(len(pdf_document)):
            # Get page
            page = pdf_document.load_page(page_num)

            # Convert to image
            mat = fitz.Matrix(dpi/72, dpi/72)  # Scale factor for DPI
            pix = page.get_pixmap(matrix=mat)

            # Save as temporary image
            temp_dir = tempfile.gettempdir()
            image_path = os.path.join(temp_dir, f"pdf_page_{page_num}_{os.getpid()}.png")
            pix.save(image_path)
            image_paths.append(image_path)

        pdf_document.close()
        return image_paths

    except Exception as e:
        print(f"Error converting PDF to images: {e}")
        return []

def extract_text_from_pdf(pdf_path: str) -> Tuple[str, float]:
    """Extract text directly from PDF if possible."""
    try:
        pdf_document = fitz.open(pdf_path)
        full_text = ""

        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text = page.get_text()
            full_text += text + "\n"

        pdf_document.close()

        # If we got substantial text, assume good confidence
        if len(full_text.strip()) > 50:
            return full_text.strip(), 0.9
        else:
            return full_text.strip(), 0.3

    except Exception as e:
        return f"Error: {str(e)}", 0.0

def cleanup_temp_images(image_paths: List[str]):
    """Clean up temporary image files."""
    for image_path in image_paths:
        try:
            if os.path.exists(image_path):
                os.remove(image_path)
        except Exception as e:
            print(f"Warning: Could not remove temp file {image_path}: {e}")
