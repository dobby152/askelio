"""
Duplicate Detection Service
Detects duplicate invoices based on invoice numbers, amounts, and vendor information
"""

import hashlib
import json
import logging
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from models_sqlite import Document, ExtractedField
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DuplicateDetectionService:
    """Service for detecting duplicate invoices"""
    
    def __init__(self):
        self.logger = logger
    
    def generate_invoice_hash(self, invoice_data: Dict[str, Any]) -> str:
        """
        Generate a hash for invoice based on key identifying fields
        
        Args:
            invoice_data: Dictionary containing extracted invoice fields
            
        Returns:
            SHA256 hash string
        """
        # Key fields for duplicate detection
        key_fields = [
            'invoice_number',
            'supplier_name', 
            'vendor',
            'total_amount',
            'date',
            'currency'
        ]
        
        # Build normalized data for hashing
        hash_data = {}
        
        for field in key_fields:
            value = invoice_data.get(field)
            if value is not None:
                # Normalize the value
                if isinstance(value, str):
                    # Remove whitespace and convert to lowercase
                    hash_data[field] = value.strip().lower()
                elif isinstance(value, (int, float)):
                    # Round amounts to 2 decimal places
                    hash_data[field] = round(float(value), 2)
                else:
                    hash_data[field] = str(value).strip().lower()
        
        # Create deterministic string for hashing
        hash_string = json.dumps(hash_data, sort_keys=True, ensure_ascii=False)
        
        # Generate SHA256 hash
        return hashlib.sha256(hash_string.encode('utf-8')).hexdigest()
    
    def extract_invoice_data_from_fields(self, extracted_fields: List[ExtractedField]) -> Dict[str, Any]:
        """
        Extract relevant invoice data from extracted fields
        
        Args:
            extracted_fields: List of ExtractedField objects
            
        Returns:
            Dictionary with normalized invoice data
        """
        invoice_data = {}
        
        for field in extracted_fields:
            field_name = field.field_name
            field_value = field.field_value
            
            if not field_value:
                continue
                
            # Handle different field types
            if field_name == 'invoice_number':
                invoice_data['invoice_number'] = str(field_value).strip()
                
            elif field_name in ['supplier_name', 'vendor']:
                # Handle vendor data (might be JSON)
                if field_value.startswith('{'):
                    try:
                        vendor_data = json.loads(field_value)
                        if isinstance(vendor_data, dict) and 'name' in vendor_data:
                            invoice_data['supplier_name'] = vendor_data['name']
                        else:
                            invoice_data['supplier_name'] = str(field_value)
                    except json.JSONDecodeError:
                        invoice_data['supplier_name'] = str(field_value)
                else:
                    invoice_data['supplier_name'] = str(field_value)
                    
            elif field_name == 'totals':
                # Handle totals (usually JSON)
                try:
                    if field_value.startswith('{') or field_value.startswith("{'"):
                        # Handle both JSON and Python dict string formats
                        totals_data = json.loads(field_value.replace("'", '"'))
                        if 'total' in totals_data:
                            invoice_data['total_amount'] = float(totals_data['total'])
                    else:
                        # Try to parse as float directly
                        invoice_data['total_amount'] = float(field_value)
                except (json.JSONDecodeError, ValueError):
                    self.logger.warning(f"Could not parse totals field: {field_value}")
                    
            elif field_name == 'date':
                invoice_data['date'] = str(field_value).strip()
                
            elif field_name == 'currency':
                invoice_data['currency'] = str(field_value).strip().upper()
        
        return invoice_data
    
    def check_for_duplicates(self, db: Session, user_id: str, invoice_data: Dict[str, Any], 
                           exclude_document_id: Optional[int] = None) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Check if an invoice is a duplicate for a specific user
        
        Args:
            db: Database session
            user_id: User ID to check duplicates for
            invoice_data: Invoice data dictionary
            exclude_document_id: Document ID to exclude from check (for updates)
            
        Returns:
            Tuple of (is_duplicate, list_of_duplicate_documents)
        """
        # Generate hash for the invoice
        invoice_hash = self.generate_invoice_hash(invoice_data)
        
        # Check for exact hash matches first
        query = db.query(Document).filter(
            Document.user_id == user_id,
            Document.duplicate_hash == invoice_hash
        )
        
        if exclude_document_id:
            query = query.filter(Document.id != exclude_document_id)
            
        exact_duplicates = query.all()
        
        if exact_duplicates:
            duplicate_info = []
            for doc in exact_duplicates:
                duplicate_info.append({
                    'document_id': doc.id,
                    'filename': doc.filename,
                    'created_at': doc.created_at.isoformat() if doc.created_at else None,
                    'match_type': 'exact_hash'
                })
            return True, duplicate_info
        
        # Check for potential duplicates based on invoice number and supplier
        invoice_number = invoice_data.get('invoice_number')
        supplier_name = invoice_data.get('supplier_name')
        
        if invoice_number and supplier_name:
            # Find documents with same invoice number from same supplier
            potential_duplicates = db.query(Document).filter(
                Document.user_id == user_id
            )
            
            if exclude_document_id:
                potential_duplicates = potential_duplicates.filter(Document.id != exclude_document_id)
                
            potential_duplicates = potential_duplicates.all()
            
            similar_documents = []
            for doc in potential_duplicates:
                doc_invoice_data = self.extract_invoice_data_from_fields(doc.extracted_fields)
                
                # Check if invoice number and supplier match
                if (doc_invoice_data.get('invoice_number') == invoice_number and 
                    doc_invoice_data.get('supplier_name', '').lower() == supplier_name.lower()):
                    
                    similar_documents.append({
                        'document_id': doc.id,
                        'filename': doc.filename,
                        'created_at': doc.created_at.isoformat() if doc.created_at else None,
                        'match_type': 'invoice_number_supplier',
                        'invoice_number': doc_invoice_data.get('invoice_number'),
                        'supplier_name': doc_invoice_data.get('supplier_name'),
                        'total_amount': doc_invoice_data.get('total_amount')
                    })
            
            if similar_documents:
                return True, similar_documents
        
        return False, []
    
    def update_document_hash(self, db: Session, document_id: int) -> bool:
        """
        Update the duplicate hash for an existing document
        
        Args:
            db: Database session
            document_id: Document ID to update
            
        Returns:
            True if successful, False otherwise
        """
        try:
            document = db.query(Document).filter(Document.id == document_id).first()
            if not document:
                self.logger.error(f"Document {document_id} not found")
                return False
            
            # Extract invoice data from fields
            invoice_data = self.extract_invoice_data_from_fields(document.extracted_fields)
            
            # Generate and update hash
            document.duplicate_hash = self.generate_invoice_hash(invoice_data)
            db.commit()
            
            self.logger.info(f"Updated duplicate hash for document {document_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to update document hash: {e}")
            db.rollback()
            return False
    
    def get_duplicate_statistics(self, db: Session, user_id: str) -> Dict[str, Any]:
        """
        Get statistics about duplicates for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with duplicate statistics
        """
        try:
            # Get all user documents
            user_documents = db.query(Document).filter(Document.user_id == user_id).all()
            
            total_documents = len(user_documents)
            documents_with_hash = len([d for d in user_documents if d.duplicate_hash])
            
            # Find potential duplicates
            hash_groups = {}
            for doc in user_documents:
                if doc.duplicate_hash:
                    if doc.duplicate_hash not in hash_groups:
                        hash_groups[doc.duplicate_hash] = []
                    hash_groups[doc.duplicate_hash].append(doc)
            
            duplicate_groups = {k: v for k, v in hash_groups.items() if len(v) > 1}
            total_duplicates = sum(len(group) - 1 for group in duplicate_groups.values())
            
            return {
                'total_documents': total_documents,
                'documents_with_hash': documents_with_hash,
                'duplicate_groups': len(duplicate_groups),
                'total_duplicates': total_duplicates,
                'duplicate_rate': (total_duplicates / total_documents * 100) if total_documents > 0 else 0
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get duplicate statistics: {e}")
            return {
                'total_documents': 0,
                'documents_with_hash': 0,
                'duplicate_groups': 0,
                'total_duplicates': 0,
                'duplicate_rate': 0
            }
