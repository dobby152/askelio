# Celery worker
from ocr_processor import celery_app

if __name__ == '__main__':
    celery_app.start()
