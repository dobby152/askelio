#!/usr/bin/env python3
"""
Test duplicate detection functionality
"""

import logging
from database_sqlite import get_db
from models_sqlite import Document, ExtractedField
from services.duplicate_detection_service import DuplicateDetectionService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_duplicate_detection():
    """Test duplicate detection service"""
    
    db = next(get_db())
    duplicate_detector = DuplicateDetectionService()
    
    try:
        logger.info("=== Testing Duplicate Detection ===")
        
        # Test 1: Update existing documents with duplicate hashes
        logger.info("\n1. Updating existing documents with duplicate hashes...")
        
        all_documents = db.query(Document).all()
        for doc in all_documents:
            success = duplicate_detector.update_document_hash(db, doc.id)
            if success:
                logger.info(f"   ✅ Updated hash for document {doc.id}: {doc.filename}")
            else:
                logger.warning(f"   ⚠️ Failed to update hash for document {doc.id}")
        
        # Test 2: Check for duplicates
        logger.info("\n2. Checking for duplicates...")
        
        premium_user_id = "ad82b21b-e85c-4629-81ef-65dee068be51"
        test_user_id = "test-user-123-456-789"
        
        for user_id in [premium_user_id, test_user_id]:
            logger.info(f"\n   User: {user_id}")
            
            user_docs = db.query(Document).filter(Document.user_id == user_id).all()
            
            for doc in user_docs:
                if doc.extracted_fields:
                    invoice_data = duplicate_detector.extract_invoice_data_from_fields(doc.extracted_fields)
                    
                    is_duplicate, duplicates = duplicate_detector.check_for_duplicates(
                        db, user_id, invoice_data, exclude_document_id=doc.id
                    )
                    
                    if is_duplicate:
                        logger.warning(f"     🔍 Document {doc.id} ({doc.filename}) has {len(duplicates)} potential duplicates:")
                        for dup in duplicates:
                            logger.warning(f"       - Document {dup['document_id']}: {dup['filename']} ({dup['match_type']})")
                    else:
                        logger.info(f"     ✅ Document {doc.id} ({doc.filename}) - No duplicates found")
        
        # Test 3: Get duplicate statistics
        logger.info("\n3. Duplicate Statistics:")
        
        for user_id in [premium_user_id, test_user_id]:
            stats = duplicate_detector.get_duplicate_statistics(db, user_id)
            logger.info(f"\n   User {user_id}:")
            logger.info(f"     Total documents: {stats['total_documents']}")
            logger.info(f"     Documents with hash: {stats['documents_with_hash']}")
            logger.info(f"     Duplicate groups: {stats['duplicate_groups']}")
            logger.info(f"     Total duplicates: {stats['total_duplicates']}")
            logger.info(f"     Duplicate rate: {stats['duplicate_rate']:.1f}%")
        
        # Test 4: Test with sample invoice data
        logger.info("\n4. Testing with sample invoice data...")
        
        sample_invoice = {
            'invoice_number': '2501042',
            'supplier_name': 'Askela s.r.o.',
            'total_amount': 7865.0,
            'date': '2025-01-15',
            'currency': 'CZK'
        }
        
        is_duplicate, duplicates = duplicate_detector.check_for_duplicates(
            db, premium_user_id, sample_invoice
        )
        
        if is_duplicate:
            logger.warning(f"   🔍 Sample invoice would be a duplicate! Found {len(duplicates)} matches:")
            for dup in duplicates:
                logger.warning(f"     - Document {dup['document_id']}: {dup['filename']} ({dup['match_type']})")
        else:
            logger.info("   ✅ Sample invoice would not be a duplicate")
        
        # Test 5: Generate hash for sample data
        logger.info("\n5. Testing hash generation...")
        
        hash1 = duplicate_detector.generate_invoice_hash(sample_invoice)
        logger.info(f"   Hash for sample invoice: {hash1}")
        
        # Test with slightly different data
        sample_invoice_2 = sample_invoice.copy()
        sample_invoice_2['total_amount'] = 7865.01  # Slightly different amount
        
        hash2 = duplicate_detector.generate_invoice_hash(sample_invoice_2)
        logger.info(f"   Hash for modified invoice: {hash2}")
        
        if hash1 == hash2:
            logger.info("   ✅ Hashes are the same (amounts rounded)")
        else:
            logger.info("   ℹ️ Hashes are different")
        
        logger.info("\n=== Duplicate Detection Test Complete ===")
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_duplicate_detection()
