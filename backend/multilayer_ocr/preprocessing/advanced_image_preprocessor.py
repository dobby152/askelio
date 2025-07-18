"""
Advanced Image Preprocessor for multilayer OCR system
Implements various image enhancement techniques using OpenCV and scikit-image
"""
import cv2
import numpy as np
from PIL import Image
import logging
from typing import Tuple, Optional, Dict, Any
from skimage import filters, morphology, restoration, exposure
from skimage.transform import rotate
from skimage.feature import canny
from skimage.morphology import disk, opening, closing
import tempfile
import os

from ..core.ocr_result import ProcessingMethod

logger = logging.getLogger(__name__)


class AdvancedImagePreprocessor:
    """Advanced image preprocessing for optimal OCR results"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.temp_dir = tempfile.gettempdir()
    
    def preprocess_image(self, image_path: str, method: ProcessingMethod) -> str:
        """
        Preprocess image based on specified method
        Returns path to processed image
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Apply preprocessing based on method
            if method == ProcessingMethod.NONE:
                processed = image
            elif method == ProcessingMethod.BASIC:
                processed = self._basic_preprocessing(image)
            elif method == ProcessingMethod.GENTLE:
                processed = self._gentle_preprocessing(image)
            elif method == ProcessingMethod.AGGRESSIVE:
                processed = self._aggressive_preprocessing(image)
            elif method == ProcessingMethod.CUSTOM:
                processed = self._custom_preprocessing(image)
            else:
                processed = self._basic_preprocessing(image)
            
            # Save processed image
            output_path = self._save_processed_image(processed, image_path, method)
            
            logger.debug(f"Image preprocessed with {method.value} method: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            return image_path  # Return original if preprocessing fails
    
    def _basic_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """Basic preprocessing: grayscale, denoise, enhance contrast"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Enhance contrast using CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        # Adaptive thresholding
        binary = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        return binary
    
    def _gentle_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """Gentle preprocessing: minimal changes, preserve original quality"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Light denoising
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # Gentle contrast enhancement
        enhanced = cv2.convertScaleAbs(denoised, alpha=1.1, beta=10)
        
        # Otsu thresholding (automatic)
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        return binary
    
    def _aggressive_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """Aggressive preprocessing: maximum enhancement for difficult images"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Strong denoising
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        
        # Skew correction
        corrected = self._correct_skew(denoised)
        
        # Strong contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(corrected)
        
        # Sharpening
        kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)
        
        # Adaptive thresholding
        binary = cv2.adaptiveThreshold(
            sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        # Morphological operations to clean up
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_OPEN, kernel)
        
        return cleaned
    
    def _custom_preprocessing(self, image: np.ndarray) -> np.ndarray:
        """Custom preprocessing with advanced techniques"""
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()
        
        # Advanced denoising using Non-local Means
        denoised = cv2.fastNlMeansDenoising(gray, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Skew correction
        corrected = self._correct_skew(denoised)
        
        # Unsharp masking for sharpening
        gaussian = cv2.GaussianBlur(corrected, (0, 0), 2.0)
        sharpened = cv2.addWeighted(corrected, 1.5, gaussian, -0.5, 0)
        
        # Histogram equalization
        equalized = cv2.equalizeHist(sharpened)
        
        # Advanced thresholding using Otsu + Gaussian
        blurred = cv2.GaussianBlur(equalized, (5, 5), 0)
        _, binary = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Advanced morphological operations
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        
        closed = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel_close)
        opened = cv2.morphologyEx(closed, cv2.MORPH_OPEN, kernel_open)
        
        return opened
    
    def _correct_skew(self, image: np.ndarray) -> np.ndarray:
        """Correct skew/rotation in the image"""
        try:
            # Find edges
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            
            # Find lines using Hough transform
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            
            if lines is not None:
                # Calculate angles
                angles = []
                for rho, theta in lines[:20]:  # Use first 20 lines
                    angle = theta * 180 / np.pi
                    if angle < 45:
                        angles.append(angle)
                    elif angle > 135:
                        angles.append(angle - 180)
                
                if angles:
                    # Calculate median angle
                    median_angle = np.median(angles)
                    
                    # Only correct if angle is significant
                    if abs(median_angle) > 0.5:
                        # Rotate image
                        (h, w) = image.shape[:2]
                        center = (w // 2, h // 2)
                        M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
                        corrected = cv2.warpAffine(image, M, (w, h), 
                                                 flags=cv2.INTER_CUBIC, 
                                                 borderMode=cv2.BORDER_REPLICATE)
                        return corrected
            
            return image
            
        except Exception as e:
            logger.warning(f"Skew correction failed: {e}")
            return image
    
    def _enhance_contrast_adaptive(self, image: np.ndarray) -> np.ndarray:
        """Adaptive contrast enhancement"""
        # CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(image)
        return enhanced
    
    def _remove_noise_advanced(self, image: np.ndarray) -> np.ndarray:
        """Advanced noise removal"""
        # Non-local means denoising
        denoised = cv2.fastNlMeansDenoising(image, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # Bilateral filter for edge preservation
        bilateral = cv2.bilateralFilter(denoised, 9, 75, 75)
        
        return bilateral
    
    def _morphological_cleanup(self, image: np.ndarray) -> np.ndarray:
        """Clean up binary image using morphological operations"""
        # Remove small noise
        kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2))
        opened = cv2.morphologyEx(image, cv2.MORPH_OPEN, kernel_open)
        
        # Fill small gaps
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_close)
        
        return closed
    
    def _save_processed_image(self, image: np.ndarray, original_path: str, method: ProcessingMethod) -> str:
        """Save processed image to temporary file"""
        try:
            # Generate output filename
            base_name = os.path.splitext(os.path.basename(original_path))[0]
            output_filename = f"{base_name}_processed_{method.value}_{os.getpid()}.png"
            output_path = os.path.join(self.temp_dir, output_filename)
            
            # Save image
            cv2.imwrite(output_path, image)
            
            return output_path
            
        except Exception as e:
            logger.error(f"Failed to save processed image: {e}")
            return original_path
    
    def cleanup_temp_files(self, file_paths: list) -> None:
        """Clean up temporary processed image files"""
        for file_path in file_paths:
            try:
                if os.path.exists(file_path) and file_path.startswith(self.temp_dir):
                    os.remove(file_path)
                    logger.debug(f"Cleaned up temp file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {file_path}: {e}")
    
    def analyze_image_quality(self, image_path: str) -> Dict[str, Any]:
        """Analyze image quality and suggest best preprocessing method"""
        try:
            image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if image is None:
                return {'error': 'Could not load image'}
            
            # Calculate various quality metrics
            metrics = {
                'brightness': np.mean(image),
                'contrast': np.std(image),
                'sharpness': cv2.Laplacian(image, cv2.CV_64F).var(),
                'noise_level': self._estimate_noise_level(image),
                'skew_angle': self._estimate_skew_angle(image)
            }
            
            # Suggest preprocessing method based on metrics
            suggested_method = self._suggest_preprocessing_method(metrics)
            
            return {
                'metrics': metrics,
                'suggested_method': suggested_method.value,
                'image_size': image.shape
            }
            
        except Exception as e:
            logger.error(f"Image quality analysis failed: {e}")
            return {'error': str(e)}
    
    def _estimate_noise_level(self, image: np.ndarray) -> float:
        """Estimate noise level in image"""
        # Use Laplacian variance as noise indicator
        laplacian_var = cv2.Laplacian(image, cv2.CV_64F).var()
        return min(100.0, laplacian_var / 1000.0)  # Normalize to 0-100 scale
    
    def _estimate_skew_angle(self, image: np.ndarray) -> float:
        """Estimate skew angle in image"""
        try:
            edges = cv2.Canny(image, 50, 150, apertureSize=3)
            lines = cv2.HoughLines(edges, 1, np.pi/180, threshold=100)
            
            if lines is not None:
                angles = []
                for rho, theta in lines[:10]:
                    angle = theta * 180 / np.pi
                    if angle < 45:
                        angles.append(angle)
                    elif angle > 135:
                        angles.append(angle - 180)
                
                if angles:
                    return np.median(angles)
            
            return 0.0
            
        except Exception:
            return 0.0
    
    def _suggest_preprocessing_method(self, metrics: Dict[str, Any]) -> ProcessingMethod:
        """Suggest best preprocessing method based on image metrics"""
        brightness = metrics['brightness']
        contrast = metrics['contrast']
        sharpness = metrics['sharpness']
        noise_level = metrics['noise_level']
        skew_angle = abs(metrics['skew_angle'])
        
        # Decision logic based on image characteristics
        if noise_level > 50 or contrast < 30 or skew_angle > 2:
            return ProcessingMethod.AGGRESSIVE
        elif brightness < 100 or brightness > 200 or sharpness < 100:
            return ProcessingMethod.CUSTOM
        elif contrast > 50 and sharpness > 200 and noise_level < 20:
            return ProcessingMethod.GENTLE
        else:
            return ProcessingMethod.BASIC
