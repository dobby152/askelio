#!/usr/bin/env python3
"""
Create test data for a second user to verify user isolation
"""

import sqlite3
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_test_user_data():
    """Create test documents and data for a second user"""
    db_path = "documents.db"
    
    # Test user ID (different from premium user)
    test_user_id = "test-user-123-456-789"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create test documents for the second user
        test_documents = [
            {
                'user_id': test_user_id,
                'filename': 'test_invoice_001.pdf',
                'status': 'completed',
                'type': 'application/pdf',
                'size': '1.2 MB',
                'pages': 2,
                'accuracy': '96.5%',
                'confidence': 0.965,
                'extracted_text': 'Test invoice content...',
                'provider_used': 'test_provider',
                'data_source': 'test',
                'created_at': datetime.now().isoformat(),
                'processed_at': datetime.now().isoformat(),
                'processing_time': 2.5
            },
            {
                'user_id': test_user_id,
                'filename': 'test_receipt_002.pdf',
                'status': 'completed',
                'type': 'application/pdf',
                'size': '0.8 MB',
                'pages': 1,
                'accuracy': '94.2%',
                'confidence': 0.942,
                'extracted_text': 'Test receipt content...',
                'provider_used': 'test_provider',
                'data_source': 'test',
                'created_at': datetime.now().isoformat(),
                'processed_at': datetime.now().isoformat(),
                'processing_time': 1.8
            }
        ]
        
        # Insert test documents
        for doc in test_documents:
            cursor.execute("""
                INSERT INTO documents (
                    user_id, filename, status, type, size, pages, accuracy, 
                    confidence, extracted_text, provider_used, data_source,
                    created_at, processed_at, processing_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc['user_id'], doc['filename'], doc['status'], doc['type'],
                doc['size'], doc['pages'], doc['accuracy'], doc['confidence'],
                doc['extracted_text'], doc['provider_used'], doc['data_source'],
                doc['created_at'], doc['processed_at'], doc['processing_time']
            ))
            
            document_id = cursor.lastrowid
            logger.info(f"Created test document {document_id}: {doc['filename']}")
            
            # Add extracted fields with different financial data
            if 'invoice' in doc['filename']:
                # Test invoice with different amounts
                totals_data = {'total': 15000.0}  # Different from premium user
                cursor.execute("""
                    INSERT INTO extracted_fields (document_id, field_name, field_value, confidence, data_type)
                    VALUES (?, ?, ?, ?, ?)
                """, (document_id, 'totals', str(totals_data), 0.95, 'json'))
                
                cursor.execute("""
                    INSERT INTO extracted_fields (document_id, field_name, field_value, confidence, data_type)
                    VALUES (?, ?, ?, ?, ?)
                """, (document_id, 'supplier_name', 'Test Supplier Ltd.', 0.98, 'string'))
                
            elif 'receipt' in doc['filename']:
                # Test receipt with different amounts
                totals_data = {'total': 2500.0}  # Different from premium user
                cursor.execute("""
                    INSERT INTO extracted_fields (document_id, field_name, field_value, confidence, data_type)
                    VALUES (?, ?, ?, ?, ?)
                """, (document_id, 'totals', str(totals_data), 0.92, 'json'))
                
                cursor.execute("""
                    INSERT INTO extracted_fields (document_id, field_name, field_value, confidence, data_type)
                    VALUES (?, ?, ?, ?, ?)
                """, (document_id, 'supplier_name', 'Test Store Inc.', 0.96, 'string'))
        
        conn.commit()
        logger.info(f"Successfully created test data for user: {test_user_id}")
        logger.info("Test user should see:")
        logger.info("- Total amount: 17,500 CZK (15,000 + 2,500)")
        logger.info("- 2 documents")
        logger.info("- Different suppliers than premium user")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to create test data: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_test_user_data()
