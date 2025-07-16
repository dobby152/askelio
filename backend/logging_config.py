# Logging configuration
import logging
import sys
from datetime import datetime
import os

def setup_logging():
    """Configure logging for the application."""

    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)

    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            # Console handler
            logging.StreamHandler(sys.stdout),
            # File handler
            logging.FileHandler(
                os.path.join(log_dir, f"askelio_{datetime.now().strftime('%Y%m%d')}.log"),
                encoding='utf-8'
            )
        ]
    )

    # Configure specific loggers

    # OCR processing logger
    ocr_logger = logging.getLogger('ocr_processor')
    ocr_handler = logging.FileHandler(
        os.path.join(log_dir, f"ocr_{datetime.now().strftime('%Y%m%d')}.log"),
        encoding='utf-8'
    )
    ocr_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    ocr_logger.addHandler(ocr_handler)

    # API logger
    api_logger = logging.getLogger('api')
    api_handler = logging.FileHandler(
        os.path.join(log_dir, f"api_{datetime.now().strftime('%Y%m%d')}.log"),
        encoding='utf-8'
    )
    api_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    api_logger.addHandler(api_handler)

    # Celery logger
    celery_logger = logging.getLogger('celery')
    celery_logger.setLevel(logging.INFO)

    return logging.getLogger(__name__)

# Initialize logging
logger = setup_logging()
