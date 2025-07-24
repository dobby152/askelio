#!/usr/bin/env python3
"""
Database migration script to add ARES enrichment column
Adds ares_enriched JSON column to documents table
"""

import sqlite3
import os
import json
from datetime import datetime

DATABASE_FILE = "documents.db"

def migrate_database():
    """Add ARES enrichment column to existing database"""
    
    if not os.path.exists(DATABASE_FILE):
        print(f"❌ Database file {DATABASE_FILE} not found")
        return False
    
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'ares_enriched' in columns:
            print("✅ Column 'ares_enriched' already exists")
            return True
        
        print("🔄 Adding 'ares_enriched' column to documents table...")
        
        # Add the new column
        cursor.execute("""
            ALTER TABLE documents 
            ADD COLUMN ares_enriched TEXT
        """)
        
        # Commit changes
        conn.commit()
        
        print("✅ Successfully added 'ares_enriched' column")
        
        # Verify the column was added
        cursor.execute("PRAGMA table_info(documents)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'ares_enriched' in columns:
            print("✅ Migration verified successfully")
            
            # Show current table structure
            print("\n📋 Current table structure:")
            cursor.execute("PRAGMA table_info(documents)")
            for column in cursor.fetchall():
                print(f"  - {column[1]} ({column[2]})")
            
            return True
        else:
            print("❌ Migration verification failed")
            return False
            
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        if conn:
            conn.close()

def test_ares_column():
    """Test the new ARES column functionality"""
    try:
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        # Test inserting ARES metadata
        test_ares_data = {
            "enriched_at": datetime.now().isoformat(),
            "notes": ["✅ Vendor data enriched from ARES (IČO: 12345678)"],
            "success": True
        }
        
        print("\n🧪 Testing ARES column functionality...")
        
        # Insert test document with ARES data
        cursor.execute("""
            INSERT INTO documents (
                filename, status, type, size, pages, accuracy, 
                processed_at, processing_time, confidence, 
                extracted_text, provider_used, data_source, ares_enriched
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "test_ares_document.pdf",
            "completed",
            "application/pdf",
            "1.2 MB",
            1,
            "95.5%",
            datetime.now(),
            2.5,
            0.955,
            "Test extracted text",
            "claude-3.5-sonnet",
            "unified_processor",
            json.dumps(test_ares_data)
        ))
        
        # Get the inserted document
        cursor.execute("""
            SELECT id, filename, ares_enriched 
            FROM documents 
            WHERE filename = 'test_ares_document.pdf'
        """)
        
        result = cursor.fetchone()
        if result:
            doc_id, filename, ares_data = result
            print(f"✅ Test document inserted: ID {doc_id}")
            print(f"   Filename: {filename}")
            
            if ares_data:
                parsed_ares = json.loads(ares_data)
                print(f"   ARES data: {parsed_ares}")
                print("✅ ARES column working correctly")
            else:
                print("⚠️ ARES data is empty")
            
            # Clean up test document
            cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
            print("🧹 Test document cleaned up")
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    finally:
        if conn:
            conn.close()

def main():
    """Main migration function"""
    print("🚀 ARES Database Migration")
    print("=" * 50)
    print(f"Database: {DATABASE_FILE}")
    print(f"Time: {datetime.now().isoformat()}")
    print()
    
    # Run migration
    if migrate_database():
        print("\n🧪 Running functionality test...")
        if test_ares_column():
            print("\n✅ Migration completed successfully!")
            print("🎯 ARES enrichment is now ready to use")
        else:
            print("\n⚠️ Migration completed but test failed")
    else:
        print("\n❌ Migration failed")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
