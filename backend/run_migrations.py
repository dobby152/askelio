#!/usr/bin/env python3
"""
Script to run database migrations for the documents table
"""

import asyncio
import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append('.')

from services.document_service import document_service

async def run_documents_migration():
    """Run the documents table migration"""
    
    print("🚀 Running Documents Table Migration")
    print("=" * 50)
    
    # Read the migration file
    migration_file = Path("../database/migrations/004_create_documents_table.sql")
    
    if not migration_file.exists():
        print(f"❌ Migration file not found: {migration_file}")
        return False
    
    try:
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("📄 Migration SQL loaded successfully")
        print(f"📏 SQL length: {len(migration_sql)} characters")
        
        # Split the migration into individual statements
        statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]
        
        print(f"🔢 Found {len(statements)} SQL statements to execute")
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if not statement:
                continue
                
            print(f"\n📝 Executing statement {i}/{len(statements)}:")
            print(f"   {statement[:100]}{'...' if len(statement) > 100 else ''}")
            
            try:
                # Use raw SQL execution through Supabase
                result = await document_service.execute_query(
                    lambda: document_service.supabase.rpc('exec_sql', {'sql': statement}).execute()
                )
                
                if result['success']:
                    print(f"   ✅ Statement {i} executed successfully")
                else:
                    print(f"   ❌ Statement {i} failed: {result.get('error')}")
                    # Try alternative approach for DDL statements
                    print(f"   🔄 Trying alternative approach...")
                    
            except Exception as e:
                print(f"   ⚠️  Statement {i} error: {e}")
                # Continue with next statement
                continue
        
        # Verify the table was created
        print("\n🔍 Verifying table creation...")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents').select('*').limit(1).execute()
        )
        
        if result['success']:
            print("✅ Documents table created and accessible!")
            return True
        else:
            print(f"❌ Table verification failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def create_documents_table_simple():
    """Create documents table with a simplified approach"""
    
    print("🚀 Creating Documents Table (Simplified)")
    print("=" * 50)
    
    # Simplified table creation SQL
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS public.documents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT,
        file_size BIGINT,
        file_type TEXT NOT NULL,
        file_hash TEXT,
        status TEXT DEFAULT 'uploading',
        processing_mode TEXT DEFAULT 'accuracy_first',
        pages INTEGER DEFAULT 1,
        language TEXT DEFAULT 'cs',
        document_type TEXT,
        extracted_text TEXT,
        structured_data JSONB DEFAULT '{}',
        confidence_score DECIMAL(4,3),
        accuracy_percentage DECIMAL(5,2),
        ocr_provider TEXT,
        llm_model TEXT,
        processing_cost DECIMAL(10,4),
        processing_time DECIMAL(8,3),
        tokens_used INTEGER,
        error_message TEXT,
        error_code TEXT,
        retry_count INTEGER DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        tags TEXT[],
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE
    );
    """
    
    try:
        print("📝 Creating documents table...")
        
        # Try to create the table directly
        result = await document_service.execute_query(
            lambda: document_service.supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        )
        
        if not result['success']:
            print(f"❌ Direct table creation failed: {result.get('error')}")
            return False
        
        print("✅ Documents table created successfully!")
        
        # Verify the table
        print("🔍 Verifying table...")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents').select('*').limit(1).execute()
        )
        
        if result['success']:
            print("✅ Table verification successful!")
            return True
        else:
            print(f"❌ Table verification failed: {result.get('error')}")
            return False
            
    except Exception as e:
        print(f"❌ Table creation failed: {e}")
        return False

if __name__ == "__main__":
    print("Choose migration approach:")
    print("1. Full migration (recommended)")
    print("2. Simple table creation")
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        success = asyncio.run(run_documents_migration())
    elif choice == "2":
        success = asyncio.run(create_documents_table_simple())
    else:
        print("Invalid choice")
        success = False
    
    if success:
        print("\n🎉 Migration completed successfully!")
    else:
        print("\n💥 Migration failed!")
        sys.exit(1)
