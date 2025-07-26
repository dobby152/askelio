#!/usr/bin/env python3
"""
Migration script to add duplicate_hash column to documents table
"""

import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_add_duplicate_hash():
    """Add duplicate_hash column to documents table"""
    db_path = "documents.db"
    
    if not os.path.exists(db_path):
        logger.error(f"Database file {db_path} not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if duplicate_hash column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'duplicate_hash' in columns:
            logger.info("duplicate_hash column already exists")
            return True
        
        # Add duplicate_hash column
        logger.info("Adding duplicate_hash column to documents table...")
        cursor.execute("ALTER TABLE documents ADD COLUMN duplicate_hash TEXT")
        
        # Create index on duplicate_hash for better performance
        logger.info("Creating index on duplicate_hash...")
        cursor.execute("CREATE INDEX idx_documents_duplicate_hash ON documents(duplicate_hash)")
        
        conn.commit()
        logger.info("Migration completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate_add_duplicate_hash()
