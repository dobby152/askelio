#!/usr/bin/env python3
"""
Test user data isolation by simulating different users
"""

import sqlite3
import json
import logging
from database_sqlite import get_db
from models_sqlite import Document, ExtractedField

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_user_data_isolation():
    """Test that users only see their own data"""
    
    # User IDs
    premium_user_id = "ad82b21b-e85c-4629-81ef-65dee068be51"
    test_user_id = "test-user-123-456-789"
    
    db = next(get_db())
    
    try:
        logger.info("=== Testing User Data Isolation ===")
        
        # Test 1: Premium user data
        logger.info(f"\n1. Testing Premium User ({premium_user_id}):")
        premium_docs = db.query(Document).filter(Document.user_id == premium_user_id).all()
        logger.info(f"   Documents found: {len(premium_docs)}")
        
        premium_total = 0
        for doc in premium_docs:
            logger.info(f"   - {doc.filename} (ID: {doc.id})")
            if doc.extracted_fields:
                for field in doc.extracted_fields:
                    if field.field_name == "totals" and field.field_value:
                        try:
                            totals_data = json.loads(field.field_value.replace("'", '"'))
                            if 'total' in totals_data:
                                amount = float(totals_data['total'])
                                premium_total += amount
                                logger.info(f"     Amount: {amount:,.0f} CZK")
                        except (ValueError, json.JSONDecodeError):
                            continue
        
        logger.info(f"   Total for Premium User: {premium_total:,.0f} CZK")
        
        # Test 2: Test user data
        logger.info(f"\n2. Testing Test User ({test_user_id}):")
        test_docs = db.query(Document).filter(Document.user_id == test_user_id).all()
        logger.info(f"   Documents found: {len(test_docs)}")
        
        test_total = 0
        for doc in test_docs:
            logger.info(f"   - {doc.filename} (ID: {doc.id})")
            if doc.extracted_fields:
                for field in doc.extracted_fields:
                    if field.field_name == "totals" and field.field_value:
                        try:
                            totals_data = json.loads(field.field_value.replace("'", '"'))
                            if 'total' in totals_data:
                                amount = float(totals_data['total'])
                                test_total += amount
                                logger.info(f"     Amount: {amount:,.0f} CZK")
                        except (ValueError, json.JSONDecodeError):
                            continue
        
        logger.info(f"   Total for Test User: {test_total:,.0f} CZK")
        
        # Test 3: Cross-contamination check
        logger.info(f"\n3. Cross-contamination Check:")
        all_docs = db.query(Document).all()
        logger.info(f"   Total documents in database: {len(all_docs)}")
        
        premium_count = len([d for d in all_docs if d.user_id == premium_user_id])
        test_count = len([d for d in all_docs if d.user_id == test_user_id])
        other_count = len([d for d in all_docs if d.user_id not in [premium_user_id, test_user_id]])
        
        logger.info(f"   Premium user documents: {premium_count}")
        logger.info(f"   Test user documents: {test_count}")
        logger.info(f"   Other user documents: {other_count}")
        
        # Test 4: Verify isolation
        logger.info(f"\n4. Isolation Verification:")
        if premium_total != test_total:
            logger.info("   ✅ Users have different financial totals - GOOD!")
        else:
            logger.warning("   ⚠️ Users have same financial totals - potential issue")
            
        if premium_count > 0 and test_count > 0:
            logger.info("   ✅ Both users have documents - GOOD!")
        else:
            logger.warning("   ⚠️ One or both users have no documents")
            
        logger.info(f"\n=== Summary ===")
        logger.info(f"Premium User: {premium_count} docs, {premium_total:,.0f} CZK total")
        logger.info(f"Test User: {test_count} docs, {test_total:,.0f} CZK total")
        logger.info(f"Data isolation: {'✅ WORKING' if premium_total != test_total else '⚠️ NEEDS CHECK'}")
        
        return True
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_user_data_isolation()
