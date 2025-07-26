#!/usr/bin/env python3
"""
Check what fields are extracted from documents
"""

import sqlite3
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_extracted_fields():
    """Check what fields are extracted from documents"""
    db_path = "documents.db"
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all distinct field names
        cursor.execute("SELECT DISTINCT field_name FROM extracted_fields ORDER BY field_name")
        field_names = cursor.fetchall()
        
        logger.info("=== Extracted Field Names ===")
        for field_name in field_names:
            logger.info(f"- {field_name[0]}")
        
        # Get sample data for each field
        logger.info("\n=== Sample Field Values ===")
        for field_name in field_names:
            cursor.execute("""
                SELECT field_value, confidence, data_type 
                FROM extracted_fields 
                WHERE field_name = ? 
                LIMIT 3
            """, (field_name[0],))
            
            samples = cursor.fetchall()
            logger.info(f"\n{field_name[0]}:")
            for sample in samples:
                value, confidence, data_type = sample
                # Truncate long values
                display_value = value[:100] + "..." if value and len(value) > 100 else value
                logger.info(f"  Value: {display_value}")
                logger.info(f"  Confidence: {confidence}")
                logger.info(f"  Type: {data_type}")
                logger.info("  ---")
        
        # Check for invoice numbers specifically
        logger.info("\n=== Looking for Invoice Numbers ===")
        potential_invoice_fields = [
            'invoice_number', 'invoice_id', 'document_number', 'number', 
            'faktura_cislo', 'cislo_faktury', 'document_id', 'reference'
        ]
        
        for field in potential_invoice_fields:
            cursor.execute("""
                SELECT COUNT(*) FROM extracted_fields 
                WHERE field_name LIKE ? OR field_name LIKE ?
            """, (f'%{field}%', f'%{field.upper()}%'))
            
            count = cursor.fetchone()[0]
            if count > 0:
                logger.info(f"Found {count} records with field containing '{field}'")
                
                # Get sample values
                cursor.execute("""
                    SELECT field_name, field_value 
                    FROM extracted_fields 
                    WHERE field_name LIKE ? OR field_name LIKE ?
                    LIMIT 3
                """, (f'%{field}%', f'%{field.upper()}%'))
                
                samples = cursor.fetchall()
                for field_name, value in samples:
                    logger.info(f"  {field_name}: {value}")
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to check fields: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_extracted_fields()
