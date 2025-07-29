#!/usr/bin/env python3
"""
Invoice Direction Detection Service
Automatically determines if an invoice is incoming (expense) or outgoing (revenue)
based on company profile matching
"""

import logging
import re
from typing import Dict, Any, Optional, Tuple, List
from decimal import Decimal
from datetime import datetime
from uuid import UUID

from models.supabase_models import (
    InvoiceDirection,
    TransactionType,
    InvoiceDirectionAnalysisCreate,
    FinancialTransactionCreate
)
from services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)

class InvoiceDirectionService:
    """
    Service for automatic invoice direction detection
    """
    
    def __init__(self):
        self.supabase_service = SupabaseService()
        
    async def analyze_invoice_direction(
        self, 
        user_id: UUID, 
        document_id: UUID, 
        structured_data: Dict[str, Any]
    ) -> Tuple[InvoiceDirection, Decimal, str]:
        """
        Analyze invoice direction based on company profile matching
        
        Returns:
            Tuple of (direction, confidence, method)
        """
        try:
            logger.info(f"🔍 Analyzing invoice direction for document {document_id}")
            
            # Get user's company profile
            company_profile = await self._get_user_company_profile(user_id)
            if not company_profile:
                logger.warning(f"No company profile found for user {user_id}")
                return InvoiceDirection.UNKNOWN, Decimal('0.0'), 'no_company_profile'
            
            # Extract vendor and customer data from structured data
            vendor_data = structured_data.get('vendor', {})
            customer_data = structured_data.get('customer', {})
            
            logger.info(f"📊 Vendor: {vendor_data.get('name', 'N/A')}")
            logger.info(f"📊 Customer: {customer_data.get('name', 'N/A')}")
            logger.info(f"🏢 Company: {company_profile['company_name']}")

            # Analyze matches
            vendor_match_score = self._calculate_company_match(vendor_data, company_profile)
            customer_match_score = self._calculate_company_match(customer_data, company_profile)
            
            logger.info(f"📈 Vendor match score: {vendor_match_score}")
            logger.info(f"📈 Customer match score: {customer_match_score}")
            
            # Determine direction based on match scores
            direction, confidence, method = self._determine_direction(
                vendor_match_score, customer_match_score
            )
            
            # Store analysis results
            await self._store_analysis_results(
                user_id, document_id, direction, confidence, method,
                vendor_match_score, customer_match_score
            )
            
            logger.info(f"✅ Direction determined: {direction.value} (confidence: {confidence})")
            return direction, confidence, method
            
        except Exception as e:
            logger.error(f"❌ Error analyzing invoice direction: {e}")
            return InvoiceDirection.UNKNOWN, Decimal('0.0'), 'error'
    
    async def _get_user_company_profile(self, user_id: UUID) -> Optional[dict]:
        """Get user's company profile from existing companies system"""
        try:
            # Use the corrected function to get company data
            result = await self.supabase_service.supabase.rpc('get_user_primary_company', {'user_uuid': str(user_id)}).execute()

            if result.data and len(result.data) > 0:
                company_data = result.data[0]
                return {
                    'company_name': company_data['company_name'],
                    'registration_number': company_data['registration_number'],
                    'tax_number': company_data['tax_number']
                }
            return None

        except Exception as e:
            logger.error(f"Error fetching company profile: {e}")
            return None
    
    def _calculate_company_match(
        self,
        invoice_party: Dict[str, Any],
        company_profile: dict
    ) -> Decimal:
        """
        Calculate match score between invoice party and company profile
        Returns score from 0.0 to 1.0
        """
        if not invoice_party:
            return Decimal('0.0')
        
        total_score = Decimal('0.0')
        max_possible_score = Decimal('0.0')
        
        # IČO match (highest weight)
        if company_profile.get('registration_number') and invoice_party.get('ico'):
            max_possible_score += Decimal('0.5')
            if self._normalize_ico(company_profile['registration_number']) == self._normalize_ico(invoice_party.get('ico')):
                total_score += Decimal('0.5')
                logger.debug("✅ IČO match found")

        # DIČ match (high weight)
        if company_profile.get('tax_number') and invoice_party.get('dic'):
            max_possible_score += Decimal('0.3')
            if self._normalize_dic(company_profile['tax_number']) == self._normalize_dic(invoice_party.get('dic')):
                total_score += Decimal('0.3')
                logger.debug("✅ DIČ match found")

        # Company name match (medium weight)
        if company_profile.get('company_name') and invoice_party.get('name'):
            max_possible_score += Decimal('0.2')
            name_similarity = self._calculate_name_similarity(
                company_profile['company_name'],
                invoice_party.get('name')
            )
            total_score += Decimal(str(name_similarity)) * Decimal('0.2')
            logger.debug(f"📝 Name similarity: {name_similarity}")
        
        # Return normalized score
        if max_possible_score > 0:
            return total_score / max_possible_score
        return Decimal('0.0')
    
    def _normalize_ico(self, ico: str) -> str:
        """Normalize IČO for comparison"""
        if not ico:
            return ""
        # Remove all non-digits and pad to 8 digits
        digits = re.sub(r'\D', '', ico)
        return digits.zfill(8) if len(digits) <= 8 else digits
    
    def _normalize_dic(self, dic: str) -> str:
        """Normalize DIČ for comparison"""
        if not dic:
            return ""
        # Remove spaces and convert to uppercase
        return re.sub(r'\s', '', dic.upper())
    
    def _calculate_name_similarity(self, name1: str, name2: str) -> float:
        """Calculate similarity between company names"""
        if not name1 or not name2:
            return 0.0
        
        # Normalize names
        norm1 = self._normalize_company_name(name1)
        norm2 = self._normalize_company_name(name2)
        
        # Simple similarity based on common words
        words1 = set(norm1.split())
        words2 = set(norm2.split())
        
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _normalize_company_name(self, name: str) -> str:
        """Normalize company name for comparison"""
        if not name:
            return ""
        
        # Convert to lowercase and remove common suffixes
        normalized = name.lower()
        
        # Remove common company suffixes
        suffixes = [
            's.r.o.', 'sro', 'a.s.', 'as', 'spol.', 'spol', 
            'ltd.', 'ltd', 'inc.', 'inc', 'corp.', 'corp',
            'o.p.s.', 'ops', 'z.s.', 'zs'
        ]
        
        for suffix in suffixes:
            normalized = re.sub(rf'\b{re.escape(suffix)}\b', '', normalized)
        
        # Remove extra whitespace and punctuation
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        normalized = re.sub(r'\s+', ' ', normalized).strip()
        
        return normalized
    
    def _determine_direction(
        self, 
        vendor_match_score: Decimal, 
        customer_match_score: Decimal
    ) -> Tuple[InvoiceDirection, Decimal, str]:
        """
        Determine invoice direction based on match scores
        """
        # High confidence thresholds
        HIGH_CONFIDENCE = Decimal('0.8')
        MEDIUM_CONFIDENCE = Decimal('0.5')
        
        # If vendor matches our company = outgoing invoice (we are selling)
        if vendor_match_score >= HIGH_CONFIDENCE:
            return InvoiceDirection.OUTGOING, vendor_match_score, 'vendor_match'
        
        # If customer matches our company = incoming invoice (we are buying)
        if customer_match_score >= HIGH_CONFIDENCE:
            return InvoiceDirection.INCOMING, customer_match_score, 'customer_match'
        
        # Medium confidence decisions
        if vendor_match_score >= MEDIUM_CONFIDENCE and vendor_match_score > customer_match_score:
            return InvoiceDirection.OUTGOING, vendor_match_score, 'vendor_match_medium'
        
        if customer_match_score >= MEDIUM_CONFIDENCE and customer_match_score > vendor_match_score:
            return InvoiceDirection.INCOMING, customer_match_score, 'customer_match_medium'
        
        # Low confidence - unknown
        max_score = max(vendor_match_score, customer_match_score)
        return InvoiceDirection.UNKNOWN, max_score, 'low_confidence'
    
    async def _store_analysis_results(
        self,
        user_id: UUID,
        document_id: UUID,
        direction: InvoiceDirection,
        confidence: Decimal,
        method: str,
        vendor_match_score: Decimal,
        customer_match_score: Decimal
    ):
        """Store analysis results in database"""
        try:
            analysis_data = InvoiceDirectionAnalysisCreate(
                document_id=document_id,
                detected_direction=direction,
                confidence_score=confidence,
                analysis_method=method,
                vendor_match_score=vendor_match_score,
                customer_match_score=customer_match_score,
                analysis_notes={
                    'timestamp': datetime.now().isoformat(),
                    'version': '1.0'
                }
            )
            
            # Store in database
            result = await self.supabase_service.supabase.table('invoice_direction_analysis').insert({
                'document_id': str(document_id),
                'user_id': str(user_id),
                'detected_direction': direction.value,
                'confidence_score': float(confidence),
                'analysis_method': method,
                'vendor_match_score': float(vendor_match_score),
                'customer_match_score': float(customer_match_score),
                'analysis_notes': analysis_data.analysis_notes
            }).execute()
            
            logger.info(f"✅ Analysis results stored for document {document_id}")
            
        except Exception as e:
            logger.error(f"❌ Error storing analysis results: {e}")
    
    async def create_financial_transaction(
        self,
        user_id: UUID,
        document_id: UUID,
        structured_data: Dict[str, Any],
        direction: InvoiceDirection
    ) -> Optional[UUID]:
        """
        Create financial transaction based on invoice data and direction
        """
        try:
            # Determine transaction type
            transaction_type = TransactionType.UNKNOWN
            if direction == InvoiceDirection.OUTGOING:
                transaction_type = TransactionType.REVENUE
            elif direction == InvoiceDirection.INCOMING:
                transaction_type = TransactionType.EXPENSE
            
            # Extract financial data
            totals = structured_data.get('totals', {})
            vendor = structured_data.get('vendor', {})
            customer = structured_data.get('customer', {})
            
            amount = totals.get('total', 0)
            if not amount:
                logger.warning(f"No amount found in structured data for document {document_id}")
                return None
            
            transaction_data = {
                'document_id': str(document_id),
                'user_id': str(user_id),
                'transaction_type': transaction_type.value,
                'amount': float(amount),
                'currency': 'CZK',
                'invoice_number': structured_data.get('invoice_number'),
                'invoice_date': structured_data.get('date'),
                'due_date': structured_data.get('due_date'),
                'vendor_name': vendor.get('name'),
                'vendor_ico': vendor.get('ico'),
                'customer_name': customer.get('name'),
                'customer_ico': customer.get('ico'),
                'vat_rate': totals.get('vat_rate'),
                'vat_amount': totals.get('vat_amount'),
                'net_amount': totals.get('subtotal'),
                'status': 'pending'
            }
            
            result = await self.supabase_service.supabase.table('financial_transactions').insert(transaction_data).execute()
            
            if result.data:
                transaction_id = result.data[0]['id']
                logger.info(f"✅ Financial transaction created: {transaction_id}")
                return UUID(transaction_id)
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error creating financial transaction: {e}")
            return None
