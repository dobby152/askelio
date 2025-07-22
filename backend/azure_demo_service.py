#!/usr/bin/env python3
"""
Demo Azure Computer Vision service for testing OCR functionality
This simulates the Azure Computer Vision API for development/testing purposes
"""

import time
import uuid
from typing import Dict, Any, List
import pytesseract
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class MockAzureResponse:
    """Mock Azure Computer Vision response object"""
    
    def __init__(self, status: str = "succeeded"):
        self.status = status
        self.analyze_result = MockAnalyzeResult()

class MockAnalyzeResult:
    """Mock analyze result object"""
    
    def __init__(self):
        self.read_results = []

class MockReadResult:
    """Mock read result object"""
    
    def __init__(self, lines: List[str]):
        self.lines = [MockLine(line) for line in lines]

class MockLine:
    """Mock line object"""
    
    def __init__(self, text: str):
        self.text = text
        self.bounding_box = [0.1, 0.1, 0.9, 0.9]  # Mock bounding box

class MockReadResponse:
    """Mock read response with operation location"""
    
    def __init__(self, operation_id: str):
        self.headers = {
            "Operation-Location": f"https://demo.cognitiveservices.azure.com/vision/v3.2/read/analyzeResults/{operation_id}"
        }

class DemoAzureComputerVisionClient:
    """
    Demo Azure Computer Vision client that simulates the real API
    Uses Tesseract as the underlying OCR engine but formats responses like Azure
    """
    
    def __init__(self, endpoint: str, credentials):
        self.endpoint = endpoint
        self.credentials = credentials
        self.operations = {}  # Store operation results
        logger.info(f"Demo Azure Computer Vision client initialized with endpoint: {endpoint}")
    
    def read_in_stream(self, image_stream, raw=True):
        """Simulate Azure read_in_stream API"""
        operation_id = str(uuid.uuid4())
        
        # Process image with Tesseract
        try:
            # Reset stream position
            image_stream.seek(0)
            
            # Open image and process with Tesseract
            image = Image.open(image_stream)
            
            # Use Tesseract to extract text
            config = '--oem 3 --psm 6 -l eng+ces'
            text = pytesseract.image_to_string(image, config=config)
            
            # Split text into lines
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            # Store result for later retrieval
            self.operations[operation_id] = {
                'status': 'succeeded',
                'lines': lines,
                'created_time': time.time()
            }
            
            logger.info(f"Demo Azure OCR operation {operation_id} created with {len(lines)} lines")
            
        except Exception as e:
            logger.error(f"Demo Azure OCR failed: {e}")
            self.operations[operation_id] = {
                'status': 'failed',
                'lines': [],
                'error': str(e),
                'created_time': time.time()
            }
        
        return MockReadResponse(operation_id)
    
    def get_read_result(self, operation_id: str):
        """Simulate Azure get_read_result API"""
        if operation_id not in self.operations:
            return MockAzureResponse("failed")
        
        operation = self.operations[operation_id]
        
        # Simulate processing time
        if time.time() - operation['created_time'] < 0.5:
            return MockAzureResponse("running")
        
        if operation['status'] == 'failed':
            return MockAzureResponse("failed")
        
        # Create successful response
        response = MockAzureResponse("succeeded")
        read_result = MockReadResult(operation['lines'])
        response.analyze_result.read_results = [read_result]
        
        return response

def create_demo_azure_client(endpoint: str, key: str):
    """
    Create a demo Azure Computer Vision client
    This function mimics the real Azure client creation but returns our demo client
    """
    
    class MockCredentials:
        def __init__(self, key: str):
            self.key = key
    
    credentials = MockCredentials(key)
    return DemoAzureComputerVisionClient(endpoint, credentials)

# Demo credentials for testing
DEMO_AZURE_ENDPOINT = "https://demo-ocr-service.cognitiveservices.azure.com/"
DEMO_AZURE_KEY = "demo-key-12345678901234567890123456789012"

def get_demo_credentials():
    """Get demo Azure Computer Vision credentials"""
    return {
        'endpoint': DEMO_AZURE_ENDPOINT,
        'key': DEMO_AZURE_KEY
    }

if __name__ == "__main__":
    # Test the demo service
    import io
    
    # Create test image
    test_image = Image.new('RGB', (400, 200), color='white')
    from PIL import ImageDraw, ImageFont
    draw = ImageDraw.Draw(test_image)
    
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    draw.text((20, 50), "Demo Azure OCR Test\nLine 1\nLine 2", fill='black', font=font)
    
    # Save to bytes
    img_bytes = io.BytesIO()
    test_image.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    # Test demo client
    client = create_demo_azure_client(DEMO_AZURE_ENDPOINT, DEMO_AZURE_KEY)
    
    # Test read operation
    read_response = client.read_in_stream(img_bytes)
    print(f"Operation started: {read_response.headers['Operation-Location']}")
    
    # Get operation ID
    operation_id = read_response.headers["Operation-Location"].split("/")[-1]
    
    # Wait and get result
    time.sleep(1)
    result = client.get_read_result(operation_id)
    
    print(f"Operation status: {result.status}")
    if result.status == "succeeded":
        for read_result in result.analyze_result.read_results:
            for line in read_result.lines:
                print(f"Extracted text: {line.text}")
