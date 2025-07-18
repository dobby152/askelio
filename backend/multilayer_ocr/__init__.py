"""
Multilayer OCR System
Advanced OCR processing with multiple providers and AI decision making
"""

from .core.multilayer_ocr_engine import MultilayerOCREngine
from .core.ocr_result import (
    OCRResult, MultilayerOCRResult, OCRProviderType, ProcessingMethod,
    StructuredData, QualityMetrics, OCRMetadata
)
from .ai_decision.ai_decision_engine import AIDecisionEngine
from .fusion.result_fusion_engine import ResultFusionEngine
from .preprocessing.advanced_image_preprocessor import AdvancedImagePreprocessor

# Provider imports
from .providers.tesseract_provider import TesseractProvider
from .providers.google_vision_provider import GoogleVisionProvider
from .providers.azure_computer_vision_provider import AzureComputerVisionProvider
from .providers.paddleocr_provider import PaddleOCRProvider

__version__ = "1.0.0"
__author__ = "Askelio Team"
__description__ = "Multilayer OCR System with AI Decision Making"

__all__ = [
    # Core classes
    'MultilayerOCREngine',
    'OCRResult',
    'MultilayerOCRResult',
    'OCRProviderType',
    'ProcessingMethod',
    'StructuredData',
    'QualityMetrics',
    'OCRMetadata',
    
    # AI and Fusion
    'AIDecisionEngine',
    'ResultFusionEngine',
    'AdvancedImagePreprocessor',
    
    # Providers
    'TesseractProvider',
    'GoogleVisionProvider',
    'AzureComputerVisionProvider',
    'PaddleOCRProvider',
    
    # Factory function
    'create_multilayer_ocr_engine'
]


def create_multilayer_ocr_engine(config: dict = None) -> MultilayerOCREngine:
    """
    Factory function to create a fully configured MultilayerOCREngine
    
    Args:
        config: Configuration dictionary with provider settings
        
    Returns:
        Configured MultilayerOCREngine instance
    """
    config = config or {}
    
    # Create the main engine
    engine = MultilayerOCREngine(config.get('engine', {}))
    
    # Create and register AI decision engine
    ai_config = config.get('ai_decision', {})
    ai_engine = AIDecisionEngine(ai_config)
    engine.register_ai_decision_engine(ai_engine)
    
    # Create and register result fusion engine
    fusion_config = config.get('fusion', {})
    fusion_engine = ResultFusionEngine(fusion_config)
    engine.register_result_fusion_engine(fusion_engine)
    
    # Register available providers
    providers_config = config.get('providers', {})
    
    # Tesseract Provider
    if providers_config.get('tesseract', {}).get('enabled', True):
        tesseract_config = providers_config.get('tesseract', {})
        tesseract_provider = TesseractProvider(tesseract_config)
        engine.register_provider(tesseract_provider)
    
    # Google Vision Provider
    if providers_config.get('google_vision', {}).get('enabled', True):
        google_config = providers_config.get('google_vision', {})
        google_provider = GoogleVisionProvider(google_config)
        engine.register_provider(google_provider)
    
    # Azure Computer Vision Provider
    if providers_config.get('azure_vision', {}).get('enabled', False):
        azure_config = providers_config.get('azure_vision', {})
        azure_provider = AzureComputerVisionProvider(azure_config)
        engine.register_provider(azure_provider)
    
    # PaddleOCR Provider
    if providers_config.get('paddle_ocr', {}).get('enabled', False):
        paddle_config = providers_config.get('paddle_ocr', {})
        paddle_provider = PaddleOCRProvider(paddle_config)
        engine.register_provider(paddle_provider)
    
    return engine
