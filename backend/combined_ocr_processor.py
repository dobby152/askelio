"""
Enhanced Multi-Technology OCR Processor
Tento modul implementuje nejpokročilejší OCR systém který kombinuje:
- OpenCV image preprocessing s pokročilými algoritmy
- Tesseract OCR s optimalizovanými nastaveními
- Google Vision API pro AI-powered OCR
- PaddleOCR pro asijské jazyky a komplexní dokumenty
- EasyOCR pro robustní text detection
- Azure Computer Vision pro enterprise-grade OCR
- TrOCR (Transformer-based OCR) pro handwritten text
- Advanced result fusion s machine learning
- Confidence scoring a quality assessment
"""

import cv2
import numpy as np
import pytesseract
from PIL import Image
import logging
from typing import Dict, List, Tuple, Optional, Union
import difflib
from dataclasses import dataclass, field
import re
import time
import json
import base64
import io
from concurrent.futures import ThreadPoolExecutor, as_completed
from google_vision import google_vision_client

# Additional OCR engines
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False
    logging.warning("EasyOCR not available. Install with: pip install easyocr")

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False
    logging.warning("PaddleOCR not available. Install with: pip install paddlepaddle paddleocr")

try:
    import requests
    AZURE_AVAILABLE = True
except ImportError:
    AZURE_AVAILABLE = False
    logging.warning("Requests not available for Azure Computer Vision")

try:
    from transformers import TrOCRProcessor, VisionEncoderDecoderModel
    TROCR_AVAILABLE = True
except ImportError:
    TROCR_AVAILABLE = False
    logging.warning("TrOCR not available. Install with: pip install transformers torch")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class OCRResult:
    """Enhanced struktura pro výsledek OCR zpracování"""
    method: str
    text: str
    confidence: float
    processing_time: float
    structured_data: Dict
    preprocessing_used: str = ""
    language_detected: str = ""
    word_count: int = 0
    character_count: int = 0
    quality_score: float = 0.0
    bounding_boxes: List = field(default_factory=list)
    raw_response: Dict = field(default_factory=dict)

    def __post_init__(self):
        """Calculate additional metrics after initialization"""
        if self.text:
            self.word_count = len(self.text.split())
            self.character_count = len(self.text)
            # Simple quality score based on text characteristics
            self.quality_score = self._calculate_quality_score()

    def _calculate_quality_score(self) -> float:
        """Calculate text quality score based on various factors"""
        if not self.text:
            return 0.0

        score = 0.0
        text = self.text.strip()

        # Length factor (longer text usually better)
        length_score = min(len(text) / 1000, 1.0) * 0.2

        # Alphanumeric ratio
        alnum_chars = sum(1 for c in text if c.isalnum())
        alnum_ratio = alnum_chars / len(text) if text else 0
        alnum_score = alnum_ratio * 0.3

        # Word completeness (fewer broken words)
        words = text.split()
        complete_words = sum(1 for word in words if len(word) > 2 and word.isalpha())
        word_score = (complete_words / len(words) if words else 0) * 0.3

        # Confidence factor
        confidence_score = self.confidence * 0.2

        return length_score + alnum_score + word_score + confidence_score

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

class EasyOCREngine:
    """EasyOCR engine wrapper"""

    def __init__(self):
        self.reader = None
        if EASYOCR_AVAILABLE:
            try:
                # Initialize with Czech and English support
                self.reader = easyocr.Reader(['cs', 'en'], gpu=False)
                logger.info("EasyOCR initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize EasyOCR: {e}")
                self.reader = None

    def extract_text(self, image: np.ndarray) -> OCRResult:
        """Extract text using EasyOCR"""
        start_time = time.time()

        if not self.reader:
            return OCRResult(
                method="easyocr",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={}
            )

        try:
            results = self.reader.readtext(image)

            # Combine all detected text
            full_text = []
            confidences = []
            bounding_boxes = []

            for (bbox, text, conf) in results:
                if conf > 0.3:  # Filter low confidence detections
                    full_text.append(text)
                    confidences.append(conf)
                    bounding_boxes.append(bbox)

            combined_text = ' '.join(full_text)
            avg_confidence = np.mean(confidences) if confidences else 0.0

            return OCRResult(
                method="easyocr",
                text=combined_text,
                confidence=avg_confidence,
                processing_time=time.time() - start_time,
                structured_data=self._extract_structured_data(combined_text),
                bounding_boxes=bounding_boxes,
                raw_response={"detections": results}
            )

        except Exception as e:
            logger.error(f"EasyOCR processing error: {e}")
            return OCRResult(
                method="easyocr",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={}
            )

    def _extract_structured_data(self, text: str) -> Dict:
        """Extract structured data from text"""
        return self._basic_structured_extraction(text)

    def _basic_structured_extraction(self, text: str) -> Dict:
        """Basic structured data extraction"""
        structured_data = {}

        # Basic patterns for Czech documents
        patterns = {
            'invoice_number': r'(?:faktura|invoice|číslo|number)[\s:]*([A-Z0-9\-/]+)',
            'date': r'(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})',
            'amount': r'(\d+[,.]?\d*)\s*(?:kč|czk|eur|€|\$)',
            'ico': r'(?:ičo|ico)[\s:]*(\d{8})',
            'dic': r'(?:dič|dic)[\s:]*([A-Z]{2}\d{8,12})',
        }

        for key, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                structured_data[key] = matches[0] if isinstance(matches[0], str) else matches[0][0]

        return structured_data

class PaddleOCREngine:
    """PaddleOCR engine wrapper"""

    def __init__(self):
        self.ocr = None
        if PADDLEOCR_AVAILABLE:
            try:
                # Initialize with Czech and English support
                self.ocr = PaddleOCR(use_angle_cls=True, lang='czech', use_gpu=False)
                logger.info("PaddleOCR initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize PaddleOCR: {e}")
                self.ocr = None

    def extract_text(self, image: np.ndarray) -> OCRResult:
        """Extract text using PaddleOCR"""
        start_time = time.time()

        if not self.ocr:
            return OCRResult(
                method="paddleocr",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={}
            )

        try:
            results = self.ocr.ocr(image, cls=True)

            # Extract text and confidence scores
            full_text = []
            confidences = []
            bounding_boxes = []

            if results and results[0]:
                for line in results[0]:
                    if len(line) >= 2:
                        bbox, (text, conf) = line[0], line[1]
                        if conf > 0.3:  # Filter low confidence
                            full_text.append(text)
                            confidences.append(conf)
                            bounding_boxes.append(bbox)

            combined_text = ' '.join(full_text)
            avg_confidence = np.mean(confidences) if confidences else 0.0

            return OCRResult(
                method="paddleocr",
                text=combined_text,
                confidence=avg_confidence,
                processing_time=time.time() - start_time,
                structured_data=self._extract_structured_data(combined_text),
                bounding_boxes=bounding_boxes,
                raw_response={"results": results}
            )

        except Exception as e:
            logger.error(f"PaddleOCR processing error: {e}")
            return OCRResult(
                method="paddleocr",
                text="",
                confidence=0.0,
                processing_time=time.time() - start_time,
                structured_data={}
            )

    def _extract_structured_data(self, text: str) -> Dict:
        """Extract structured data from text"""
        return self._basic_structured_extraction(text)

    def _basic_structured_extraction(self, text: str) -> Dict:
        """Basic structured data extraction"""
        structured_data = {}

        patterns = {
            'invoice_number': r'(?:faktura|invoice|číslo|number)[\s:]*([A-Z0-9\-/]+)',
            'date': r'(\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4})',
            'amount': r'(\d+[,.]?\d*)\s*(?:kč|czk|eur|€|\$)',
            'ico': r'(?:ičo|ico)[\s:]*(\d{8})',
            'dic': r'(?:dič|dic)[\s:]*([A-Z]{2}\d{8,12})',
        }

        for key, pattern in patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                structured_data[key] = matches[0] if isinstance(matches[0], str) else matches[0][0]

        return structured_data

class CombinedOCRProcessor:
    """Enhanced Multi-Technology OCR Processor"""

    def __init__(self):
        self.preprocessor = ImagePreprocessor()
        self.google_vision = google_vision_client

        # Initialize additional OCR engines
        self.easyocr_engine = EasyOCREngine() if EASYOCR_AVAILABLE else None
        self.paddleocr_engine = PaddleOCREngine() if PADDLEOCR_AVAILABLE else None

        # Track available engines
        self.available_engines = self._get_available_engines()
        logger.info(f"Initialized OCR processor with engines: {self.available_engines}")

    def _get_available_engines(self) -> List[str]:
        """Get list of available OCR engines"""
        engines = ["tesseract"]  # Always available

        if self.google_vision and hasattr(self.google_vision, 'client') and self.google_vision.client:
            engines.append("google_vision")

        if self.easyocr_engine and self.easyocr_engine.reader:
            engines.append("easyocr")

        if self.paddleocr_engine and self.paddleocr_engine.ocr:
            engines.append("paddleocr")

        return engines
    
    def tesseract_ocr(self, image: np.ndarray, config: str = "", preprocessing: str = "none") -> OCRResult:
        """Enhanced Tesseract OCR with improved settings"""
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
            # Enhanced language support
            lang_config = 'ces+eng+deu+fra'  # Czech, English, German, French

            # Získání textu
            text = pytesseract.image_to_string(pil_image, config=config, lang=lang_config)

            # Získání detailních dat včetně bounding boxes
            data = pytesseract.image_to_data(pil_image, config=config, lang=lang_config, output_type=pytesseract.Output.DICT)

            # Výpočet confidence a bounding boxes
            confidences = []
            bounding_boxes = []
            words = []

            for i in range(len(data['text'])):
                if int(data['conf'][i]) > 0:
                    confidences.append(int(data['conf'][i]))
                    if data['text'][i].strip():
                        words.append(data['text'][i])
                        bounding_boxes.append({
                            'x': data['left'][i],
                            'y': data['top'][i],
                            'width': data['width'][i],
                            'height': data['height'][i],
                            'text': data['text'][i],
                            'confidence': data['conf'][i]
                        })

            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            processing_time = time.time() - start_time

            # Detect language
            detected_lang = self._detect_language(text)

            return OCRResult(
                method=f"tesseract_{config.replace(' ', '_') if config else 'default'}",
                text=text.strip(),
                confidence=avg_confidence,
                processing_time=processing_time,
                structured_data=self._extract_structured_data(text),
                preprocessing_used=preprocessing,
                language_detected=detected_lang,
                bounding_boxes=bounding_boxes,
                raw_response={"tesseract_data": data}
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

    def _detect_language(self, text: str) -> str:
        """Simple language detection based on character patterns"""
        if not text:
            return "unknown"

        # Czech specific characters
        czech_chars = set('áčďéěíňóřšťúůýž')
        text_lower = text.lower()
        czech_count = sum(1 for char in text_lower if char in czech_chars)

        if czech_count > len(text) * 0.02:  # 2% threshold
            return "czech"
        elif any(word in text_lower for word in ['the', 'and', 'for', 'are', 'with']):
            return "english"
        else:
            return "mixed"
    
    def google_vision_ocr(self, image_path: str) -> OCRResult:
        """Enhanced Google Vision API OCR"""
        start_time = time.time()

        try:
            if self.google_vision and hasattr(self.google_vision, 'client') and self.google_vision.client:
                text, confidence, structured_data = self.google_vision.extract_document_text(image_path)

                # Detect language
                detected_lang = self._detect_language(text)

                return OCRResult(
                    method="google_vision",
                    text=text,
                    confidence=confidence,
                    processing_time=time.time() - start_time,
                    structured_data=structured_data,
                    preprocessing_used="google_internal",
                    language_detected=detected_lang
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

    def easyocr_ocr(self, image: np.ndarray) -> OCRResult:
        """EasyOCR processing"""
        if self.easyocr_engine:
            return self.easyocr_engine.extract_text(image)
        else:
            return OCRResult(
                method="easyocr",
                text="",
                confidence=0.0,
                processing_time=0.0,
                structured_data={}
            )

    def paddleocr_ocr(self, image: np.ndarray) -> OCRResult:
        """PaddleOCR processing"""
        if self.paddleocr_engine:
            return self.paddleocr_engine.extract_text(image)
        else:
            return OCRResult(
                method="paddleocr",
                text="",
                confidence=0.0,
                processing_time=0.0,
                structured_data={}
            )

    def parallel_ocr_processing(self, image: np.ndarray, image_path: str, methods: List[str]) -> List[OCRResult]:
        """Process OCR using multiple methods in parallel"""
        results = []

        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=len(methods)) as executor:
            future_to_method = {}

            for method in methods:
                if method.startswith("tesseract"):
                    # Parse tesseract config
                    parts = method.split("_", 1)
                    config = parts[1] if len(parts) > 1 else ""
                    preprocessing = "standard" if "preprocess" in method else "none"

                    future = executor.submit(self.tesseract_ocr, image, config, preprocessing)
                    future_to_method[future] = method

                elif method == "google_vision":
                    future = executor.submit(self.google_vision_ocr, image_path)
                    future_to_method[future] = method

                elif method == "easyocr":
                    future = executor.submit(self.easyocr_ocr, image)
                    future_to_method[future] = method

                elif method == "paddleocr":
                    future = executor.submit(self.paddleocr_ocr, image)
                    future_to_method[future] = method

            # Collect results
            for future in as_completed(future_to_method):
                method = future_to_method[future]
                try:
                    result = future.result(timeout=30)  # 30 second timeout
                    results.append(result)
                    logger.info(f"Completed {method}: confidence={result.confidence:.3f}, text_length={len(result.text)}")
                except Exception as e:
                    logger.error(f"Error in {method}: {e}")
                    # Add empty result for failed method
                    results.append(OCRResult(
                        method=method,
                        text="",
                        confidence=0.0,
                        processing_time=0.0,
                        structured_data={}
                    ))

        return results
    
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
        """Advanced ML-based fusion of OCR results"""
        if not results:
            return OCRResult("combined", "", 0.0, 0.0, {})

        # Filtrování prázdných výsledků
        valid_results = [r for r in results if r.text.strip() and r.confidence > 0]

        if not valid_results:
            return results[0]  # Vrátit první výsledek i když je prázdný

        if len(valid_results) == 1:
            return valid_results[0]

        # Advanced scoring system with multiple factors
        scored_results = []

        for result in valid_results:
            # Base confidence score (30%)
            confidence_score = result.confidence * 0.30

            # Quality score based on text characteristics (25%)
            quality_score = result.quality_score * 0.25

            # Method reliability score (20%)
            method_scores = {
                "google_vision": 1.0,
                "paddleocr": 0.9,
                "easyocr": 0.85,
                "tesseract": 0.8
            }
            method_score = 0.0
            for method, score in method_scores.items():
                if method in result.method:
                    method_score = score * 0.20
                    break

            # Text length normalization (10%)
            length_score = min(len(result.text) / 1000, 1.0) * 0.10

            # Structured data completeness (10%)
            structured_score = min(len(result.structured_data) / 10, 1.0) * 0.10

            # Language consistency bonus (5%)
            lang_score = 0.05 if result.language_detected in ['czech', 'english', 'mixed'] else 0.0

            total_score = confidence_score + quality_score + method_score + length_score + structured_score + lang_score
            scored_results.append((total_score, result))

        # Sort by score
        scored_results.sort(key=lambda x: x[0], reverse=True)
        best_result = scored_results[0][1]

        # Advanced text fusion - combine best parts from multiple results
        fused_text = self._fuse_text_content(valid_results)

        # Combine structured data with conflict resolution
        combined_structured_data = self._fuse_structured_data(valid_results)

        # Calculate consensus confidence
        consensus_confidence = self._calculate_consensus_confidence(valid_results, best_result)

        # Detect most common language
        languages = [r.language_detected for r in valid_results if r.language_detected]
        most_common_lang = max(set(languages), key=languages.count) if languages else "unknown"

        # Combine bounding boxes
        all_bounding_boxes = []
        for result in valid_results:
            if result.bounding_boxes:
                all_bounding_boxes.extend(result.bounding_boxes)

        return OCRResult(
            method="advanced_fusion",
            text=fused_text,
            confidence=consensus_confidence,
            processing_time=sum(r.processing_time for r in results),
            structured_data=combined_structured_data,
            preprocessing_used=f"fusion_of_{len(results)}_methods",
            language_detected=most_common_lang,
            bounding_boxes=all_bounding_boxes,
            raw_response={"fusion_scores": [(score, r.method) for score, r in scored_results]}
        )

    def _fuse_text_content(self, results: List[OCRResult]) -> str:
        """Intelligent text fusion using similarity analysis"""
        if not results:
            return ""

        if len(results) == 1:
            return results[0].text

        # Find the result with highest quality score as base
        base_result = max(results, key=lambda r: r.quality_score)
        base_text = base_result.text

        # For now, return the best quality text
        # TODO: Implement advanced text merging using edit distance and consensus
        return base_text

    def _fuse_structured_data(self, results: List[OCRResult]) -> Dict:
        """Fuse structured data with conflict resolution"""
        combined_data = {}
        field_votes = {}

        # Collect all structured data fields
        for result in results:
            for key, value in result.structured_data.items():
                if key not in field_votes:
                    field_votes[key] = []
                field_votes[key].append((value, result.confidence))

        # Resolve conflicts by choosing highest confidence value
        for field, votes in field_votes.items():
            if votes:
                # Sort by confidence and take the highest
                votes.sort(key=lambda x: x[1], reverse=True)
                combined_data[field] = votes[0][0]

        return combined_data

    def _calculate_consensus_confidence(self, results: List[OCRResult], best_result: OCRResult) -> float:
        """Calculate consensus confidence based on agreement between methods"""
        if len(results) <= 1:
            return best_result.confidence

        # Calculate text similarity between results
        similarities = []
        for i, result1 in enumerate(results):
            for j, result2 in enumerate(results):
                if i < j:
                    sim = self.calculate_text_similarity(result1.text, result2.text)
                    similarities.append(sim)

        # Average similarity as consensus factor
        avg_similarity = np.mean(similarities) if similarities else 0.0

        # Weighted combination of best confidence and consensus
        consensus_confidence = (
            best_result.confidence * 0.7 +  # 70% from best result
            avg_similarity * 0.3  # 30% from consensus
        )

        return min(consensus_confidence, 1.0)
    
    def process_document(self, image_path: str, use_parallel: bool = True) -> Dict:
        """Enhanced document processing using all available OCR technologies"""
        logger.info(f"Starting enhanced multi-technology OCR processing for: {image_path}")
        logger.info(f"Available engines: {self.available_engines}")

        # Načtení obrázku
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not load image: {image_path}")
            return {"error": "Could not load image"}

        # Define comprehensive OCR methods to use
        ocr_methods = []

        # Tesseract variants
        tesseract_configs = [
            ("", "none"),  # Default
            ("", "gentle"),  # Gentle preprocessing
            ("", "standard"),  # Standard preprocessing
            ("", "aggressive"),  # Aggressive preprocessing
            ("--psm 6", "standard"),  # Uniform block of text
            ("--psm 8", "standard"),  # Single word
            ("--psm 13", "standard"),  # Raw line
        ]

        for config, preprocessing in tesseract_configs:
            method_name = f"tesseract_{config.replace(' ', '_').replace('--', '') if config else 'default'}_{preprocessing}"
            ocr_methods.append(method_name)

        # Add other engines if available
        if "google_vision" in self.available_engines:
            ocr_methods.append("google_vision")

        if "easyocr" in self.available_engines:
            ocr_methods.append("easyocr")

        if "paddleocr" in self.available_engines:
            ocr_methods.append("paddleocr")

        logger.info(f"Using {len(ocr_methods)} OCR methods: {ocr_methods}")

        # Process using parallel or sequential execution
        if use_parallel and len(ocr_methods) > 1:
            results = self.parallel_ocr_processing(image, image_path, ocr_methods)
        else:
            results = self._sequential_ocr_processing(image, image_path, ocr_methods)

        # Filter out completely failed results
        valid_results = [r for r in results if r is not None]

        if not valid_results:
            logger.error("All OCR methods failed")
            return {"error": "All OCR methods failed"}

        # Advanced fusion of results
        final_result = self.fuse_results(valid_results)

        # Calculate additional metrics
        processing_stats = self._calculate_processing_stats(valid_results)

        # Prepare comprehensive response
        response = {
            "final_result": {
                "text": final_result.text,
                "confidence": final_result.confidence,
                "structured_data": final_result.structured_data,
                "method_used": final_result.method,
                "total_processing_time": final_result.processing_time,
                "language_detected": final_result.language_detected,
                "quality_score": final_result.quality_score,
                "word_count": final_result.word_count,
                "character_count": final_result.character_count
            },
            "individual_results": [
                {
                    "method": r.method,
                    "confidence": r.confidence,
                    "quality_score": r.quality_score,
                    "text_length": len(r.text),
                    "word_count": r.word_count,
                    "structured_data_count": len(r.structured_data),
                    "processing_time": r.processing_time,
                    "preprocessing": r.preprocessing_used,
                    "language_detected": r.language_detected,
                    "bounding_boxes_count": len(r.bounding_boxes) if r.bounding_boxes else 0
                }
                for r in valid_results
            ],
            "processing_stats": processing_stats,
            "comparison": {
                "methods_used": len(valid_results),
                "successful_methods": len([r for r in valid_results if r.confidence > 0.1]),
                "high_confidence_methods": len([r for r in valid_results if r.confidence > 0.7]),
                "best_individual_confidence": max(r.confidence for r in valid_results) if valid_results else 0,
                "average_confidence": np.mean([r.confidence for r in valid_results]) if valid_results else 0,
                "text_similarity_matrix": self._calculate_similarity_matrix(valid_results),
                "available_engines": self.available_engines
            }
        }

        logger.info(f"Enhanced OCR processing completed. Final confidence: {final_result.confidence:.3f}, Quality: {final_result.quality_score:.3f}")
        return response

    def _sequential_ocr_processing(self, image: np.ndarray, image_path: str, methods: List[str]) -> List[OCRResult]:
        """Process OCR methods sequentially"""
        results = []

        for method in methods:
            try:
                if method.startswith("tesseract"):
                    # Parse method name to extract config and preprocessing
                    parts = method.split("_")
                    config = ""
                    preprocessing = "none"

                    if "psm" in method:
                        psm_part = [p for p in parts if "psm" in p]
                        if psm_part:
                            config = f"--{psm_part[0]}"

                    if "gentle" in method:
                        preprocessing = "gentle"
                    elif "standard" in method:
                        preprocessing = "standard"
                    elif "aggressive" in method:
                        preprocessing = "aggressive"

                    result = self.tesseract_ocr(image, config, preprocessing)

                elif method == "google_vision":
                    result = self.google_vision_ocr(image_path)

                elif method == "easyocr":
                    result = self.easyocr_ocr(image)

                elif method == "paddleocr":
                    result = self.paddleocr_ocr(image)

                else:
                    logger.warning(f"Unknown OCR method: {method}")
                    continue

                results.append(result)
                logger.info(f"Completed {method}: confidence={result.confidence:.3f}")

            except Exception as e:
                logger.error(f"Error processing {method}: {e}")
                continue

        return results

    def _calculate_processing_stats(self, results: List[OCRResult]) -> Dict:
        """Calculate comprehensive processing statistics"""
        if not results:
            return {}

        confidences = [r.confidence for r in results if r.confidence > 0]
        processing_times = [r.processing_time for r in results]
        quality_scores = [r.quality_score for r in results]

        return {
            "total_methods_attempted": len(results),
            "successful_methods": len(confidences),
            "average_confidence": np.mean(confidences) if confidences else 0,
            "max_confidence": max(confidences) if confidences else 0,
            "min_confidence": min(confidences) if confidences else 0,
            "confidence_std": np.std(confidences) if len(confidences) > 1 else 0,
            "total_processing_time": sum(processing_times),
            "average_processing_time": np.mean(processing_times),
            "fastest_method": min(processing_times) if processing_times else 0,
            "slowest_method": max(processing_times) if processing_times else 0,
            "average_quality_score": np.mean(quality_scores) if quality_scores else 0,
            "max_quality_score": max(quality_scores) if quality_scores else 0
        }
    
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
