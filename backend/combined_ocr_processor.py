"""
Combined OCR Processor - Kombinace AI (Google Vision) s tradičními OCR metodami
Tento modul implementuje pokročilý OCR systém který kombinuje:
- OpenCV image preprocessing
- Tesseract OCR s různými nastaveními
- Google Vision API
- Result fusion algoritmus pro nejlepší výsledky
"""

import cv2
import numpy as np
import pytesseract
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional
import difflib
from dataclasses import dataclass
import re
from google_vision import google_vision_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OCRResult:
    """Struktura pro výsledek OCR zpracování"""
    method: str
    text: str
    confidence: float
    processing_time: float
    structured_data: Dict
    preprocessing_used: str = ""

class ImagePreprocessor:
    """OpenCV image preprocessing pro zlepšení OCR výsledků"""
    
    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        """Odstranění šumu z obrázku"""
        return cv2.fastNlMeansDenoising(image)
    
    @staticmethod
    def enhance_contrast(image: np.ndarray) -> np.ndarray:
        """Zlepšení kontrastu pomocí CLAHE"""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        return clahe.apply(image)
    
    @staticmethod
    def binarize_adaptive(image: np.ndarray) -> np.ndarray:
        """Adaptivní binarizace"""
        return cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
    
    @staticmethod
    def correct_skew(image: np.ndarray) -> np.ndarray:
        """Korekce natočení dokumentu"""
        # Detekce hran
        edges = cv2.Canny(image, 50, 150, apertureSize=3)
        
        # Hough transform pro detekci čar
        lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
        
        if lines is not None:
            # Výpočet průměrného úhlu
            angles = []
            for rho, theta in lines[:10]:  # Použij prvních 10 čar
                angle = theta * 180 / np.pi
                if angle < 45:
                    angles.append(angle)
                elif angle > 135:
                    angles.append(angle - 180)
            
            if angles:
                median_angle = np.median(angles)
                
                # Rotace obrázku
                (h, w) = image.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                return rotated
        
        return image
    
    @staticmethod
    def morphological_cleanup(image: np.ndarray) -> np.ndarray:
        """Morfologické operace pro vyčištění obrázku"""
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(image, cv2.MORPH_CLOSE, kernel)
        return cleaned
    
    @classmethod
    def preprocess_for_ocr(cls, image: np.ndarray, method: str = "standard") -> np.ndarray:
        """Kompletní preprocessing pipeline"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        if method == "aggressive":
            # Agresivní preprocessing
            processed = cls.denoise(gray)
            processed = cls.enhance_contrast(processed)
            processed = cls.correct_skew(processed)
            processed = cls.binarize_adaptive(processed)
            processed = cls.morphological_cleanup(processed)
        elif method == "gentle":
            # Jemný preprocessing
            processed = cls.enhance_contrast(gray)
            processed = cls.binarize_adaptive(processed)
        else:
            # Standardní preprocessing
            processed = cls.denoise(gray)
            processed = cls.enhance_contrast(processed)
            processed = cls.binarize_adaptive(processed)
        
        return processed

class CombinedOCRProcessor:
    """Kombinovaný OCR processor - AI + tradiční metody"""
    
    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.google_vision = google_vision_client
    
    def tesseract_ocr(self, image: np.ndarray, config: str = "", preprocessing: str = "none") -> OCRResult:
        """Tesseract OCR s různými nastaveními"""
        import time
        start_time = time.time()
        
        # Preprocessing pokud je požadován
        if preprocessing != "none":
            processed_image = self.preprocessor.preprocess_for_ocr(image, preprocessing)
        else:
            processed_image = image
        
        # Konverze na PIL Image
        pil_image = Image.fromarray(processed_image)
        
        # OCR zpracování
        try:
            # Získání textu
            text = pytesseract.image_to_string(pil_image, config=config, lang='ces+eng')
            
            # Získání confidence score
            data = pytesseract.image_to_data(pil_image, config=config, lang='ces+eng', output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            
            processing_time = time.time() - start_time
            
            return OCRResult(
                method=f"tesseract_{config.replace(' ', '_') if config else 'default'}",
                text=text.strip(),
                confidence=avg_confidence,
                processing_time=processing_time,
                structured_data=self._extract_structured_data(text),
                preprocessing_used=preprocessing
            )
            
        except Exception as e:
            logger.error(f"Tesseract OCR error: {e}")
            return OCRResult(
                method=f"tesseract_{config.replace(' ', '_') if config else 'default'}",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={},
                preprocessing_used=preprocessing
            )
    
    def google_vision_ocr(self, image_path: str) -> OCRResult:
        """Google Vision API OCR"""
        import time
        start_time = time.time()
        
        try:
            if self.google_vision.client:
                text, confidence, structured_data = self.google_vision.extract_document_text(image_path)
                
                return OCRResult(
                    method="google_vision",
                    text=text,
                    confidence=confidence,
                    processing_time=time.time() - start_time,
                    structured_data=structured_data,
                    preprocessing_used="google_internal"
                )
            else:
                logger.warning("Google Vision API not available")
                return OCRResult(
                    method="google_vision",
                    text="",
                    confidence=0.0,
                    processing_time=time.time() - start_time,
                    structured_data={},
                    preprocessing_used="google_internal"
                )
                
        except Exception as e:
            logger.error(f"Google Vision OCR error: {e}")
            return OCRResult(
                method="google_vision",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={},
                preprocessing_used="google_internal"
            )
    
    def _extract_structured_data(self, text: str) -> Dict:
        """Extrakce strukturovaných dat z textu"""
        structured_data = {}
        
        # Regex patterns pro české faktury
        patterns = {
            'invoice_number': r'(?:faktura|invoice|číslo|number)[\s:]*([A-Z0-9\-/]+)',
            'date': r'(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})',
            'amount': r'(\d+[,.]?\d*)\s*(?:kč|czk|eur|€|\$)',
            'ico': r'(?:ičo|ico)[\s:]*(\d{8})',
            'dic': r'(?:dič|dic)[\s:]*([A-Z]{2}\d{8,12})',
            'company': r'(?:dodavatel|supplier)[\s:]*([^\n]+)',
        }
        
        for key, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                structured_data[key] = matches[0] if isinstance(matches[0], str) else matches[0][0]
        
        return structured_data
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Výpočet podobnosti mezi dvěma texty"""
        return difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def fuse_results(self, results: List[OCRResult]) -> OCRResult:
        """Kombinace výsledků z různých OCR metod"""
        if not results:
            return OCRResult("combined", "", 0.0, 0.0, {})
        
        # Filtrování prázdných výsledků
        valid_results = [r for r in results if r.text.strip() and r.confidence > 0]
        
        if not valid_results:
            return results[0]  # Vrátit první výsledek i když je prázdný
        
        # Váhovaný scoring systém
        scored_results = []
        for result in valid_results:
            score = (
                result.confidence * 0.4 +  # 40% confidence
                (len(result.text) / 1000) * 0.2 +  # 20% text length
                len(result.structured_data) * 0.1 +  # 10% structured data
                (1.0 if result.method == "google_vision" else 0.8) * 0.3  # 30% method preference
            )
            scored_results.append((score, result))
        
        # Seřazení podle skóre
        scored_results.sort(key=lambda x: x[0], reverse=True)
        best_result = scored_results[0][1]
        
        # Kombinace structured data ze všech výsledků
        combined_structured_data = {}
        for result in valid_results:
            combined_structured_data.update(result.structured_data)
        
        # Vytvoření finálního výsledku
        return OCRResult(
            method="combined_fusion",
            text=best_result.text,
            confidence=best_result.confidence,
            processing_time=sum(r.processing_time for r in results),
            structured_data=combined_structured_data,
            preprocessing_used=f"multiple_methods_{len(results)}"
        )
    
    def process_document(self, image_path: str) -> Dict:
        """Hlavní metoda pro zpracování dokumentu kombinací všech metod"""
        logger.info(f"Starting combined OCR processing for: {image_path}")
        
        # Načtení obrázku
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image: {image_path}")
            return {"error": "Could not load image"}
        
        results = []
        
        # 1. Tesseract s default nastaveními
        results.append(self.tesseract_ocr(image, "", "none"))
        
        # 2. Tesseract s gentle preprocessing
        results.append(self.tesseract_ocr(image, "", "gentle"))
        
        # 3. Tesseract s aggressive preprocessing
        results.append(self.tesseract_ocr(image, "", "aggressive"))
        
        # 4. Tesseract s PSM 6 (uniform block of text)
        results.append(self.tesseract_ocr(image, "--psm 6", "standard"))
        
        # 5. Google Vision API
        results.append(self.google_vision_ocr(image_path))
        
        # Kombinace výsledků
        final_result = self.fuse_results(results)
        
        # Příprava odpovědi
        response = {
            "final_result": {
                "text": final_result.text,
                "confidence": final_result.confidence,
                "structured_data": final_result.structured_data,
                "method_used": final_result.method,
                "total_processing_time": final_result.processing_time
            },
            "individual_results": [
                {
                    "method": r.method,
                    "confidence": r.confidence,
                    "text_length": len(r.text),
                    "structured_data_count": len(r.structured_data),
                    "processing_time": r.processing_time,
                    "preprocessing": r.preprocessing_used
                }
                for r in results
            ],
            "comparison": {
                "methods_used": len(results),
                "successful_methods": len([r for r in results if r.confidence > 0]),
                "best_individual_confidence": max(r.confidence for r in results),
                "text_similarity_matrix": self._calculate_similarity_matrix(results)
            }
        }
        
        logger.info(f"Combined OCR processing completed. Final confidence: {final_result.confidence:.2f}")
        return response
    
    def _calculate_similarity_matrix(self, results: List[OCRResult]) -> Dict:
        """Výpočet matice podobnosti mezi výsledky"""
        similarity_matrix = {}
        
        for i, result1 in enumerate(results):
            for j, result2 in enumerate(results):
                if i < j and result1.text and result2.text:
                    similarity = self.calculate_text_similarity(result1.text, result2.text)
                    key = f"{result1.method}_vs_{result2.method}"
                    similarity_matrix[key] = similarity
        
        return similarity_matrix

# Globální instance
combined_ocr_processor = CombinedOCRProcessor()
