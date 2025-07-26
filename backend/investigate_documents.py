#!/usr/bin/env python3
"""
Script to investigate phantom documents issue in the database
"""

import asyncio
import os
import sys
from datetime import datetime

# Add current directory to path
sys.path.append('.')

from services.document_service import document_service

async def investigate_documents():
    """Investigate the current state of documents in the database"""
    
    print("🔍 Investigating Documents Database State")
    print("=" * 50)
    
    try:
        # 1. Get all documents without user filtering
        print("\n1. Raw documents in database (no user filter):")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents')
            .select('id, user_id, filename, status, created_at, file_path')
            .order('created_at', desc=True)
            .limit(20)
            .execute()
        )
        
        if result['success'] and result['data']:
            print(f"Found {len(result['data'])} documents:")
            for i, doc in enumerate(result['data'], 1):
                print(f"  {i}. ID: {doc['id'][:8]}...")
                print(f"     User: {doc['user_id']}")
                print(f"     File: {doc['filename']}")
                print(f"     Status: {doc['status']}")
                print(f"     Created: {doc['created_at']}")
                print(f"     Path: {doc.get('file_path', 'None')}")
                print()
        else:
            print(f"❌ Error or no documents: {result.get('error')}")
        
        # 2. Check for documents with null or invalid user_id
        print("\n2. Documents with null or problematic user_id:")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents')
            .select('id, user_id, filename, status, created_at')
            .is_('user_id', 'null')
            .execute()
        )
        
        if result['success'] and result['data']:
            print(f"Found {len(result['data'])} documents with null user_id:")
            for doc in result['data']:
                print(f"  - {doc['filename']} (ID: {doc['id'][:8]}...)")
        else:
            print("✅ No documents with null user_id found")
        
        # 3. Check for documents with specific problematic user_id patterns
        print("\n3. Documents with potentially problematic user_id patterns:")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents')
            .select('id, user_id, filename, status, created_at')
            .execute()
        )
        
        if result['success'] and result['data']:
            user_counts = {}
            for doc in result['data']:
                user_id = doc['user_id']
                if user_id not in user_counts:
                    user_counts[user_id] = []
                user_counts[user_id].append(doc)
            
            print(f"Documents grouped by user_id:")
            for user_id, docs in user_counts.items():
                print(f"  User {user_id}: {len(docs)} documents")
                if len(docs) > 5:  # Flag users with many documents
                    print(f"    ⚠️  High document count - potential test/default user")
                    for doc in docs[:3]:  # Show first 3
                        print(f"      - {doc['filename']} ({doc['status']})")
                    if len(docs) > 3:
                        print(f"      ... and {len(docs) - 3} more")
        
        # 4. Check for documents without valid file paths
        print("\n4. Documents with missing or invalid file paths:")
        result = await document_service.execute_query(
            lambda: document_service.supabase.table('documents')
            .select('id, user_id, filename, file_path, status')
            .or_('file_path.is.null,file_path.eq.')
            .execute()
        )
        
        if result['success'] and result['data']:
            print(f"Found {len(result['data'])} documents with missing file paths:")
            for doc in result['data']:
                print(f"  - {doc['filename']} (User: {doc['user_id'][:8]}..., Status: {doc['status']})")
        else:
            print("✅ All documents have file paths")
        
        print("\n" + "=" * 50)
        print("🔍 Investigation Complete")
        
    except Exception as e:
        print(f"❌ Error during investigation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(investigate_documents())
