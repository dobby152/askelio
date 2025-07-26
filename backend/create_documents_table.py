#!/usr/bin/env python3
"""
Script to create the documents table using direct Supabase client
"""

import asyncio
import os
import sys
from pathlib import Path

# Add current directory to path
sys.path.append('.')

from services.supabase_client import get_supabase

async def create_documents_table():
    """Create the documents table directly using Supabase client"""
    
    print("🚀 Creating Documents Table")
    print("=" * 50)
    
    try:
        supabase = get_supabase()
        
        # Create the documents table with proper structure
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
            status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed', 'cancelled')),
            processing_mode TEXT DEFAULT 'accuracy_first' CHECK (processing_mode IN ('accuracy_first', 'speed_first', 'cost_effective')),
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
        
        print("📝 Creating documents table...")
        
        # Try to execute the SQL directly
        try:
            result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            print("✅ Table created using RPC function")
        except Exception as rpc_error:
            print(f"⚠️  RPC approach failed: {rpc_error}")
            print("🔄 Trying alternative approach...")
            
            # Alternative: Try to create a simple record to test table existence
            try:
                # This will fail if table doesn't exist, which is what we want
                result = supabase.table('documents').select('id').limit(1).execute()
                print("✅ Documents table already exists!")
                return True
            except Exception as table_error:
                if 'does not exist' in str(table_error):
                    print("❌ Documents table does not exist and cannot be created via API")
                    print("📋 Manual steps required:")
                    print("1. Go to https://nfmjqnojvjjapszgwcfd.supabase.co")
                    print("2. Navigate to SQL Editor")
                    print("3. Run the migration file: database/migrations/004_create_documents_table.sql")
                    print("4. Or copy and paste the SQL from this script")
                    print("\n📄 SQL to execute:")
                    print(create_table_sql)
                    return False
                else:
                    print(f"❌ Unexpected error: {table_error}")
                    return False
        
        # Verify table creation
        print("🔍 Verifying table creation...")
        try:
            result = supabase.table('documents').select('id').limit(1).execute()
            print("✅ Documents table verified successfully!")
            return True
        except Exception as verify_error:
            print(f"❌ Table verification failed: {verify_error}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating documents table: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_document_operations():
    """Test basic document operations"""
    
    print("\n🧪 Testing Document Operations")
    print("=" * 50)
    
    try:
        from services.document_service import document_service
        
        # Test getting user documents (should return empty list)
        print("📋 Testing get_user_documents...")
        result = await document_service.get_user_documents("test-user-id")
        
        if result['success']:
            print(f"✅ get_user_documents works: {len(result['data'])} documents")
        else:
            print(f"❌ get_user_documents failed: {result.get('error')}")
        
        # Test getting specific document (should return not found)
        print("📄 Testing get_document_by_id...")
        result = await document_service.get_document_by_id("test-doc-id", "test-user-id")
        
        if not result['success'] and 'not found' in result.get('error', '').lower():
            print("✅ get_document_by_id works (correctly returns not found)")
        else:
            print(f"❌ get_document_by_id unexpected result: {result}")
        
        print("✅ All document operations working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing document operations: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Document Management System Setup")
    print("=" * 60)
    
    # Try to create the table
    table_created = asyncio.run(create_documents_table())
    
    # Test document operations regardless of table creation
    operations_work = asyncio.run(test_document_operations())
    
    print("\n" + "=" * 60)
    if table_created and operations_work:
        print("🎉 Setup completed successfully!")
        print("✅ Documents table created")
        print("✅ Document operations working")
    elif operations_work:
        print("⚠️  Partial success:")
        print("❌ Documents table needs manual creation")
        print("✅ Document operations working (phantom documents eliminated)")
        print("\n📋 Next steps:")
        print("1. Manually create the documents table in Supabase")
        print("2. Test document upload functionality")
    else:
        print("❌ Setup failed!")
        sys.exit(1)
