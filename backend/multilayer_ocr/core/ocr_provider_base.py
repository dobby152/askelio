"""
Abstract base class for OCR providers in multilayer OCR system
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import time
import os
from PIL import Image
import numpy as np

from .ocr_result import (
    OCRResult, OCRProviderType, ProcessingMethod, 
    OCRMetadata, StructuredData, QualityMetrics
)


class OCRProviderBase(ABC):
    """Abstract base class for all OCR providers"""
    
    def __init__(self, provider_type: OCRProviderType, config: Dict[str, Any] = None):
        self.provider_type = provider_type
        self.config = config or {}
        self.is_available = False
        self._initialize()
    
    @abstractmethod
    def _initialize(self) -> None:
        """Initialize the OCR provider (check availability, load models, etc.)"""
        pass
    
    @abstractmethod
    def _extract_text(self, image_path: str, preprocessing_method: ProcessingMethod) -> tuple:
        """
        Extract text from image using this provider
        Returns: (text, confidence, additional_metadata)
        """
        pass
    
    def extract_text_with_metadata(self, image_path: str, 
                                 preprocessing_method: ProcessingMethod = ProcessingMethod.BASIC) -> OCRResult:
        """
        Extract text and return complete OCRResult with metadata
        """
        start_time = time.time()
        
        try:
            # Check if provider is available
            if not self.is_available:
                return self._create_error_result(
                    f"{self.provider_type.value} provider is not available",
                    image_path, preprocessing_method, start_time
                )
            
            # Check if file exists
            if not os.path.exists(image_path):
                return self._create_error_result(
                    f"Image file not found: {image_path}",
                    image_path, preprocessing_method, start_time
                )
            
            # Get image metadata
            image_metadata = self._get_image_metadata(image_path)
            
            # Extract text using provider-specific implementation
            text, confidence, additional_metadata = self._extract_text(image_path, preprocessing_method)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(text, confidence)
            
            # Extract structured data
            structured_data = self._extract_structured_data(text)
            
            # Create metadata
            metadata = OCRMetadata(
                provider=self.provider_type,
                processing_method=preprocessing_method,
                processing_time=time.time() - start_time,
                image_dimensions=image_metadata['dimensions'],
                file_size=image_metadata['file_size'],
                language_detected=additional_metadata.get('language'),
                page_count=additional_metadata.get('page_count', 1),
                additional_info=additional_metadata
            )
            
            return OCRResult(
                provider=self.provider_type,
                text=text,
                confidence=confidence,
                metadata=metadata,
                structured_data=structured_data,
                quality_metrics=quality_metrics,
                success=True
            )
            
        except Exception as e:
            return self._create_error_result(
                str(e), image_path, preprocessing_method, start_time
            )
    
    def _get_image_metadata(self, image_path: str) -> Dict[str, Any]:
        """Get basic image metadata"""
        try:
            with Image.open(image_path) as img:
                return {
                    'dimensions': img.size,
                    'file_size': os.path.getsize(image_path),
                    'format': img.format,
                    'mode': img.mode
                }
        except Exception:
            return {
                'dimensions': (0, 0),
                'file_size': os.path.getsize(image_path) if os.path.exists(image_path) else 0,
                'format': 'unknown',
                'mode': 'unknown'
            }
    
    def _calculate_quality_metrics(self, text: str, confidence: float) -> QualityMetrics:
        """Calculate quality metrics for the extracted text"""
        if not text:
            return QualityMetrics(
                text_length=0, word_count=0, readable_word_ratio=0.0,
                special_char_ratio=0.0, ocr_error_count=0,
                language_consistency=0.0, structured_data_completeness=0.0,
                confidence_variance=0.0
            )
        
        words = text.split()
        word_count = len(words)
        text_length = len(text)
        
        # Calculate readable word ratio
        readable_words = sum(1 for word in words if self._is_readable_word(word))
        readable_word_ratio = readable_words / word_count if word_count > 0 else 0.0
        
        # Calculate special character ratio
        special_chars = sum(1 for c in text if not c.isalnum() and c not in ' \n\t.,!?-()[]{}')
        special_char_ratio = special_chars / text_length if text_length > 0 else 0.0
        
        # Count OCR errors
        ocr_error_count = self._count_ocr_errors(text)
        
        # Language consistency (simplified)
        language_consistency = self._calculate_language_consistency(text)
        
        return QualityMetrics(
            text_length=text_length,
            word_count=word_count,
            readable_word_ratio=readable_word_ratio,
            special_char_ratio=special_char_ratio,
            ocr_error_count=ocr_error_count,
            language_consistency=language_consistency,
            structured_data_completeness=0.0,  # Will be calculated later
            confidence_variance=0.0  # Will be calculated when comparing multiple results
        )
    
    def _is_readable_word(self, word: str) -> bool:
        """Check if a word appears to be readable (not OCR garbage)"""
        if len(word) < 2:
            return False
        
        # Check if word contains at least some letters
        if not any(c.isalpha() for c in word):
            return False
        
        # Check for common OCR error patterns
        ocr_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO', '000', '111']
        if any(pattern in word for pattern in ocr_patterns):
            return False
        
        return True
    
    def _count_ocr_errors(self, text: str) -> int:
        """Count obvious OCR errors in text"""
        error_patterns = ['|||', '###', '***', '???', 'lll', 'III', 'OOO', '000', '111']
        error_count = 0
        for pattern in error_patterns:
            error_count += text.count(pattern)
        return error_count
    
    def _calculate_language_consistency(self, text: str) -> float:
        """Calculate language consistency score (simplified)"""
        # This is a simplified implementation
        # In a real system, you might use language detection libraries
        czech_chars = sum(1 for c in text if c in 'áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ')
        total_chars = sum(1 for c in text if c.isalpha())
        
        if total_chars == 0:
            return 0.0
        
        # If we have Czech characters, assume Czech text
        if czech_chars > 0:
            return min(1.0, czech_chars / total_chars * 10)  # Boost Czech detection
        
        # Otherwise, assume English/international
        return 0.8
    
    def _extract_structured_data(self, text: str) -> StructuredData:
        """Extract structured data from text (basic implementation)"""
        # This is a basic implementation that can be overridden by specific providers
        return StructuredData()
    
    def _create_error_result(self, error_message: str, image_path: str, 
                           preprocessing_method: ProcessingMethod, start_time: float) -> OCRResult:
        """Create an error result"""
        image_metadata = self._get_image_metadata(image_path)
        
        metadata = OCRMetadata(
            provider=self.provider_type,
            processing_method=preprocessing_method,
            processing_time=time.time() - start_time,
            image_dimensions=image_metadata['dimensions'],
            file_size=image_metadata['file_size']
        )
        
        quality_metrics = QualityMetrics(
            text_length=0, word_count=0, readable_word_ratio=0.0,
            special_char_ratio=0.0, ocr_error_count=0,
            language_consistency=0.0, structured_data_completeness=0.0,
            confidence_variance=0.0
        )
        
        return OCRResult(
            provider=self.provider_type,
            text="",
            confidence=0.0,
            metadata=metadata,
            structured_data=StructuredData(),
            quality_metrics=quality_metrics,
            error_message=error_message,
            success=False
        )
    
    @abstractmethod
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about this provider"""
        pass
    
    def is_provider_available(self) -> bool:
        """Check if provider is available"""
        return self.is_available
