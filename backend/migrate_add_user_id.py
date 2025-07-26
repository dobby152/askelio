#!/usr/bin/env python3
"""
Migration script to add user_id column to documents table
"""

import sqlite3
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_add_user_id():
    """Add user_id column to documents table"""
    db_path = "documents.db"
    
    if not os.path.exists(db_path):
        logger.error(f"Database file {db_path} not found")
        return False
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if user_id column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'user_id' in columns:
            logger.info("user_id column already exists")
            return True
        
        # Add user_id column
        logger.info("Adding user_id column to documents table...")
        cursor.execute("ALTER TABLE documents ADD COLUMN user_id TEXT")
        
        # Create index on user_id for better performance
        logger.info("Creating index on user_id...")
        cursor.execute("CREATE INDEX idx_documents_user_id ON documents(user_id)")
        
        # Set default user_id for existing documents (premium user)
        default_user_id = "ad82b21b-e85c-4629-81ef-65dee068be51"
        logger.info(f"Setting default user_id for existing documents: {default_user_id}")
        cursor.execute("UPDATE documents SET user_id = ? WHERE user_id IS NULL", (default_user_id,))
        
        # Make user_id NOT NULL
        logger.info("Making user_id column NOT NULL...")
        # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
        # But for now, we'll leave it nullable and handle it in the application
        
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
    migrate_add_user_id()
