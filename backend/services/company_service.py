"""
Company Service - Správa firem, plánů a uživatelů
Handles company management, plans, user roles, and limits
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import uuid

from .supabase_client import get_supabase

logger = logging.getLogger(__name__)

class CompanyService:
    def __init__(self):
        self.supabase = get_supabase()
    
    # ===== COMPANY MANAGEMENT =====
    
    async def create_company(self, user_id: str, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new company with owner"""
        try:
            # Get free plan ID
            free_plan = self.supabase.table('company_plans').select('id').eq('name', 'free').single().execute()
            if not free_plan.data:
                return {"success": False, "error": "Free plan not found"}
            
            # Create company
            company_result = self.supabase.table('companies').insert({
                'name': company_data['name'],
                'legal_name': company_data.get('legal_name'),
                'registration_number': company_data.get('registration_number'),
                'tax_number': company_data.get('tax_number'),
                'email': company_data.get('email'),
                'phone': company_data.get('phone'),
                'website': company_data.get('website'),
                'address_line1': company_data.get('address_line1'),
                'address_line2': company_data.get('address_line2'),
                'city': company_data.get('city'),
                'postal_code': company_data.get('postal_code'),
                'country': company_data.get('country', 'CZ'),
                'plan_id': free_plan.data['id'],
                'billing_email': company_data.get('billing_email'),
                'current_users_count': 1
            }).execute()
            
            if not company_result.data:
                return {"success": False, "error": "Failed to create company"}
            
            company_id = company_result.data[0]['id']
            
            # Get owner role
            owner_role = self.supabase.table('user_roles').select('id').eq('name', 'owner').single().execute()
            if not owner_role.data:
                return {"success": False, "error": "Owner role not found"}
            
            # Add user as owner
            self.supabase.table('company_users').insert({
                'user_id': user_id,
                'company_id': company_id,
                'role_id': owner_role.data['id']
            }).execute()
            
            return {
                "success": True,
                "data": company_result.data[0],
                "message": "Company created successfully"
            }
            
        except Exception as e:
            logger.error(f"Error creating company: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_user_companies(self, user_id: str) -> Dict[str, Any]:
        """Get all companies for user"""
        try:
            result = self.supabase.table('company_users').select('''
                companies (
                    id, name, legal_name, email, phone, website,
                    address_line1, city, postal_code, country,
                    current_users_count, current_month_documents, current_storage_gb,
                    is_active, created_at,
                    company_plans (name, display_name, max_users, max_documents_per_month, max_storage_gb)
                ),
                user_roles (name, display_name, can_manage_company, can_manage_users)
            ''').eq('user_id', user_id).eq('is_active', True).execute()
            
            return {"success": True, "data": result.data}
            
        except Exception as e:
            logger.error(f"Error getting user companies: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_company_details(self, company_id: str, user_id: str) -> Dict[str, Any]:
        """Get detailed company information"""
        try:
            # Check user access
            access_check = self.supabase.table('company_users').select('id').eq('company_id', company_id).eq('user_id', user_id).eq('is_active', True).execute()
            if not access_check.data:
                return {"success": False, "error": "Access denied"}
            
            # Get company with plan details
            result = self.supabase.table('companies').select('''
                *,
                company_plans (*),
                company_users (
                    id, is_active, joined_at,
                    users!company_users_user_id_fkey (id, email, full_name),
                    user_roles (name, display_name)
                )
            ''').eq('id', company_id).single().execute()
            
            return {"success": True, "data": result.data}
            
        except Exception as e:
            logger.error(f"Error getting company details: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_company(self, company_id: str, user_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update company information"""
        try:
            # Check permissions
            can_manage = await self._check_permission(user_id, company_id, 'can_manage_company')
            if not can_manage:
                return {"success": False, "error": "Permission denied"}
            
            # Update company
            result = self.supabase.table('companies').update(update_data).eq('id', company_id).execute()
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error updating company: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # ===== PLAN MANAGEMENT =====
    
    async def get_available_plans(self) -> Dict[str, Any]:
        """Get all available company plans"""
        try:
            result = self.supabase.table('company_plans').select('*').eq('is_active', True).order('monthly_price_czk').execute()
            return {"success": True, "data": result.data}
            
        except Exception as e:
            logger.error(f"Error getting plans: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def upgrade_company_plan(self, company_id: str, user_id: str, new_plan_name: str) -> Dict[str, Any]:
        """Upgrade company plan"""
        try:
            # Check permissions
            can_manage = await self._check_permission(user_id, company_id, 'can_manage_company')
            if not can_manage:
                return {"success": False, "error": "Permission denied"}
            
            # Get new plan
            plan_result = self.supabase.table('company_plans').select('id').eq('name', new_plan_name).eq('is_active', True).single().execute()
            if not plan_result.data:
                return {"success": False, "error": "Plan not found"}
            
            # Update company plan
            result = self.supabase.table('companies').update({
                'plan_id': plan_result.data['id']
            }).eq('id', company_id).execute()
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error upgrading plan: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def check_company_limits(self, company_id: str, limit_type: str) -> Dict[str, Any]:
        """Check company usage against limits"""
        try:
            # Use database function
            result = self.supabase.rpc('check_company_limits', {
                'company_uuid': company_id,
                'check_type': limit_type
            }).execute()
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error checking limits: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # ===== USER MANAGEMENT =====
    
    async def invite_user(self, company_id: str, inviter_id: str, email: str, role_name: str) -> Dict[str, Any]:
        """Invite user to company"""
        try:
            # Check permissions
            can_manage_users = await self._check_permission(inviter_id, company_id, 'can_manage_users')
            if not can_manage_users:
                return {"success": False, "error": "Permission denied"}
            
            # Check user limits
            limits_check = await self.check_company_limits(company_id, 'users')
            if limits_check['success'] and limits_check['data']['is_over_limit']:
                return {"success": False, "error": "User limit exceeded"}
            
            # Get role
            role_result = self.supabase.table('user_roles').select('id').eq('name', role_name).single().execute()
            if not role_result.data:
                return {"success": False, "error": "Role not found"}
            
            # Check if user exists
            user_result = self.supabase.table('users').select('id').eq('email', email).execute()
            
            if user_result.data:
                # User exists, add to company
                user_id = user_result.data[0]['id']
                
                # Check if already in company
                existing = self.supabase.table('company_users').select('id').eq('company_id', company_id).eq('user_id', user_id).execute()
                if existing.data:
                    return {"success": False, "error": "User already in company"}
                
                # Add to company
                self.supabase.table('company_users').insert({
                    'user_id': user_id,
                    'company_id': company_id,
                    'role_id': role_result.data['id'],
                    'invited_by': inviter_id,
                    'invited_at': datetime.utcnow().isoformat()
                }).execute()
                
                # Update user count
                self.supabase.rpc('update_company_usage', {
                    'company_uuid': company_id,
                    'increment_users': 1
                }).execute()
                
                return {"success": True, "message": "User added to company"}
            else:
                # TODO: Send invitation email
                return {"success": True, "message": "Invitation sent"}
                
        except Exception as e:
            logger.error(f"Error inviting user: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def remove_user(self, company_id: str, remover_id: str, user_id: str) -> Dict[str, Any]:
        """Remove user from company"""
        try:
            # Check permissions
            can_manage_users = await self._check_permission(remover_id, company_id, 'can_manage_users')
            if not can_manage_users:
                return {"success": False, "error": "Permission denied"}
            
            # Cannot remove owner
            user_role = self.supabase.table('company_users').select('user_roles(name)').eq('company_id', company_id).eq('user_id', user_id).single().execute()
            if user_role.data and user_role.data['user_roles']['name'] == 'owner':
                return {"success": False, "error": "Cannot remove owner"}
            
            # Remove user
            self.supabase.table('company_users').update({'is_active': False}).eq('company_id', company_id).eq('user_id', user_id).execute()
            
            # Update user count
            self.supabase.rpc('update_company_usage', {
                'company_uuid': company_id,
                'increment_users': -1
            }).execute()
            
            return {"success": True, "message": "User removed"}
            
        except Exception as e:
            logger.error(f"Error removing user: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def update_user_role(self, company_id: str, updater_id: str, user_id: str, new_role_name: str) -> Dict[str, Any]:
        """Update user role in company"""
        try:
            # Check permissions
            can_manage_users = await self._check_permission(updater_id, company_id, 'can_manage_users')
            if not can_manage_users:
                return {"success": False, "error": "Permission denied"}
            
            # Get new role
            role_result = self.supabase.table('user_roles').select('id').eq('name', new_role_name).single().execute()
            if not role_result.data:
                return {"success": False, "error": "Role not found"}
            
            # Update role
            result = self.supabase.table('company_users').update({
                'role_id': role_result.data['id']
            }).eq('company_id', company_id).eq('user_id', user_id).execute()
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error updating user role: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # ===== HELPER METHODS =====
    
    async def _check_permission(self, user_id: str, company_id: str, permission: str) -> bool:
        """Check if user has specific permission in company"""
        try:
            result = self.supabase.table('company_users').select(f'user_roles({permission})').eq('user_id', user_id).eq('company_id', company_id).eq('is_active', True).single().execute()
            
            if result.data and result.data['user_roles']:
                return result.data['user_roles'][permission]
            return False
            
        except Exception as e:
            logger.error(f"Error checking permission: {str(e)}")
            return False
