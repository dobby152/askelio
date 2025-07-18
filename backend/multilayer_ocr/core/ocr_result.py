"""
OCR Result data structures for multilayer OCR system
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum


class OCRProviderType(Enum):
    """Types of OCR providers"""
    TESSERACT = "tesseract"
    GOOGLE_VISION = "google_vision"
    AZURE_COMPUTER_VISION = "azure_computer_vision"
    AWS_TEXTRACT = "aws_textract"
    PADDLE_OCR = "paddle_ocr"
    EASY_OCR = "easy_ocr"


class ProcessingMethod(Enum):
    """Image preprocessing methods"""
    NONE = "none"
    BASIC = "basic"
    GENTLE = "gentle"
    AGGRESSIVE = "aggressive"
    CUSTOM = "custom"


@dataclass
class OCRMetadata:
    """Metadata about OCR processing"""
    provider: OCRProviderType
    processing_method: ProcessingMethod
    processing_time: float
    image_dimensions: tuple
    file_size: int
    language_detected: Optional[str] = None
    page_count: int = 1
    additional_info: Dict[str, Any] = field(default_factory=dict)


@dataclass
class StructuredData:
    """Structured data extracted from document"""
    document_type: Optional[str] = None
    vendor: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[str] = None
    invoice_number: Optional[str] = None
    items: List[Dict[str, Any]] = field(default_factory=list)
    addresses: List[Dict[str, str]] = field(default_factory=list)
    additional_fields: Dict[str, Any] = field(default_factory=dict)


@dataclass
class QualityMetrics:
    """Quality metrics for OCR result evaluation"""
    text_length: int
    word_count: int
    readable_word_ratio: float
    special_char_ratio: float
    ocr_error_count: int
    language_consistency: float
    structured_data_completeness: float
    confidence_variance: float


@dataclass
class OCRResult:
    """Complete OCR result from a single provider"""
    provider: OCRProviderType
    text: str
    confidence: float
    metadata: OCRMetadata
    structured_data: StructuredData
    quality_metrics: QualityMetrics
    timestamp: datetime = field(default_factory=datetime.now)
    error_message: Optional[str] = None
    success: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        import math

        # Helper function to handle NaN values
        def clean_value(value):
            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                return 0.0
            return value

        return {
            'provider': self.provider.value,
            'text': self.text,
            'confidence': clean_value(self.confidence),
            'metadata': {
                'provider': self.metadata.provider.value,
                'processing_method': self.metadata.processing_method.value,
                'processing_time': clean_value(self.metadata.processing_time),
                'image_dimensions': self.metadata.image_dimensions,
                'file_size': self.metadata.file_size,
                'language_detected': self.metadata.language_detected,
                'page_count': self.metadata.page_count,
                'additional_info': self.metadata.additional_info
            },
            'structured_data': {
                'document_type': self.structured_data.document_type,
                'vendor': self.structured_data.vendor,
                'amount': self.structured_data.amount,
                'currency': self.structured_data.currency,
                'date': self.structured_data.date,
                'invoice_number': self.structured_data.invoice_number,
                'items': self.structured_data.items,
                'addresses': self.structured_data.addresses,
                'additional_fields': self.structured_data.additional_fields
            },
            'quality_metrics': {
                'text_length': self.quality_metrics.text_length,
                'word_count': self.quality_metrics.word_count,
                'readable_word_ratio': clean_value(self.quality_metrics.readable_word_ratio),
                'special_char_ratio': clean_value(self.quality_metrics.special_char_ratio),
                'ocr_error_count': self.quality_metrics.ocr_error_count,
                'language_consistency': clean_value(self.quality_metrics.language_consistency),
                'structured_data_completeness': clean_value(self.quality_metrics.structured_data_completeness),
                'confidence_variance': clean_value(self.quality_metrics.confidence_variance)
            },
            'timestamp': self.timestamp.isoformat(),
            'error_message': self.error_message,
            'success': self.success
        }


@dataclass
class MultilayerOCRResult:
    """Final result from multilayer OCR processing"""
    best_result: OCRResult
    all_results: List[OCRResult]
    ai_decision_metadata: Dict[str, Any]
    fusion_applied: bool
    final_confidence: float
    processing_summary: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        import math

        # Helper function to handle NaN values
        def clean_value(value):
            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                return 0.0
            return value

        # Clean processing summary
        clean_processing_summary = {}
        for key, value in self.processing_summary.items():
            clean_processing_summary[key] = clean_value(value)

        # Clean AI decision metadata
        clean_ai_metadata = {}
        for key, value in self.ai_decision_metadata.items():
            if isinstance(value, list):
                clean_ai_metadata[key] = [
                    {k: clean_value(v) if isinstance(v, (int, float)) else v for k, v in item.items()}
                    if isinstance(item, dict) else clean_value(item)
                    for item in value
                ]
            else:
                clean_ai_metadata[key] = clean_value(value) if isinstance(value, (int, float)) else value

        return {
            'best_result': self.best_result.to_dict(),
            'all_results': [result.to_dict() for result in self.all_results],
            'ai_decision_metadata': clean_ai_metadata,
            'fusion_applied': self.fusion_applied,
            'final_confidence': clean_value(self.final_confidence),
            'processing_summary': clean_processing_summary,
            'timestamp': self.timestamp.isoformat()
        }
