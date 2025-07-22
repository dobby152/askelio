#!/usr/bin/env python3
"""
Debug script for Azure Computer Vision
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_azure_init():
    """Test Azure Computer Vision initialization"""
    print("Testing Azure Computer Vision initialization...")
    
    # Check environment variables
    endpoint = os.getenv('AZURE_COMPUTER_VISION_ENDPOINT')
    key = os.getenv('AZURE_COMPUTER_VISION_KEY')
    
    print(f"Endpoint: {endpoint}")
    print(f"Key: {'***' + key[-4:] if key else 'None'}")
    
    if not endpoint or not key:
        print("❌ Azure credentials not found in environment variables")
        print("Please set AZURE_COMPUTER_VISION_ENDPOINT and AZURE_COMPUTER_VISION_KEY")
        return False
    
    try:
        from azure.cognitiveservices.vision.computervision import ComputerVisionClient
        from msrest.authentication import CognitiveServicesCredentials
        
        credentials = CognitiveServicesCredentials(key)
        client = ComputerVisionClient(endpoint, credentials)
        
        print("✅ Azure Computer Vision client created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create Azure client: {e}")
        return False

if __name__ == "__main__":
    test_azure_init()
