"""
Approval Service - Schvalovací workflow pro dokumenty
Handles document approval workflow, notifications, and history
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid

from .supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class ApprovalService:
    def __init__(self):
        self.supabase = get_supabase_client()
    
    # ===== APPROVAL WORKFLOW =====
    
    async def create_approval_workflow(self, document_id: str, company_id: str, creator_id: str, priority: str = 'normal') -> Dict[str, Any]:
        """Create approval workflow for document"""
        try:
            # Check if company has approval workflow enabled
            company = self.supabase.table('companies').select('approval_workflow_enabled, company_plans(has_approval_workflow)').eq('id', company_id).single().execute()
            
            if not company.data or not company.data['approval_workflow_enabled'] or not company.data['company_plans']['has_approval_workflow']:
                return {"success": False, "error": "Approval workflow not enabled"}
            
            # Get approval workflow steps for company
            workflow_steps = await self._get_workflow_steps(company_id)
            
            # Find first approver
            first_approver = await self._find_next_approver(company_id, 1, document_id)
            
            # Create approval record
            approval_data = {
                'document_id': document_id,
                'company_id': company_id,
                'workflow_step': 1,
                'total_steps': len(workflow_steps),
                'status': 'pending',
                'current_approver_id': first_approver,
                'priority': priority,
                'approval_history': [{
                    'step': 0,
                    'action': 'created',
                    'user_id': creator_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'notes': 'Approval workflow created'
                }]
            }
            
            result = self.supabase.table('document_approvals').insert(approval_data).execute()
            
            if result.data:
                # Send notification to first approver
                await self._send_approval_notification(first_approver, document_id, 'approval_requested')
                
                return {"success": True, "data": result.data[0]}
            
            return {"success": False, "error": "Failed to create approval workflow"}
            
        except Exception as e:
            logger.error(f"Error creating approval workflow: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def approve_document(self, approval_id: str, approver_id: str, notes: str = None) -> Dict[str, Any]:
        """Approve document in workflow"""
        try:
            # Get current approval state
            approval = self.supabase.table('document_approvals').select('*').eq('id', approval_id).single().execute()
            
            if not approval.data:
                return {"success": False, "error": "Approval not found"}
            
            approval_data = approval.data
            
            # Check if user can approve
            if approval_data['current_approver_id'] != approver_id:
                return {"success": False, "error": "Not authorized to approve"}
            
            if approval_data['status'] != 'pending':
                return {"success": False, "error": "Document already processed"}
            
            # Update approval history
            history = approval_data['approval_history'] or []
            history.append({
                'step': approval_data['workflow_step'],
                'action': 'approved',
                'user_id': approver_id,
                'timestamp': datetime.utcnow().isoformat(),
                'notes': notes
            })
            
            # Check if this is the final step
            if approval_data['workflow_step'] >= approval_data['total_steps']:
                # Final approval
                update_data = {
                    'status': 'approved',
                    'approval_history': history,
                    'approved_at': datetime.utcnow().isoformat()
                }
                
                # Update document status
                self.supabase.table('documents').update({'status': 'approved'}).eq('id', approval_data['document_id']).execute()
                
                # Send final notification
                await self._send_approval_notification(approval_data['document_id'], None, 'document_approved')
                
            else:
                # Move to next step
                next_step = approval_data['workflow_step'] + 1
                next_approver = await self._find_next_approver(approval_data['company_id'], next_step, approval_data['document_id'])
                
                update_data = {
                    'workflow_step': next_step,
                    'current_approver_id': next_approver,
                    'approval_history': history
                }
                
                # Send notification to next approver
                await self._send_approval_notification(next_approver, approval_data['document_id'], 'approval_requested')
            
            # Update approval record
            result = self.supabase.table('document_approvals').update(update_data).eq('id', approval_id).execute()
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error approving document: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def reject_document(self, approval_id: str, rejector_id: str, notes: str) -> Dict[str, Any]:
        """Reject document in workflow"""
        try:
            # Get current approval state
            approval = self.supabase.table('document_approvals').select('*').eq('id', approval_id).single().execute()
            
            if not approval.data:
                return {"success": False, "error": "Approval not found"}
            
            approval_data = approval.data
            
            # Check if user can reject
            if approval_data['current_approver_id'] != rejector_id:
                return {"success": False, "error": "Not authorized to reject"}
            
            if approval_data['status'] != 'pending':
                return {"success": False, "error": "Document already processed"}
            
            # Update approval history
            history = approval_data['approval_history'] or []
            history.append({
                'step': approval_data['workflow_step'],
                'action': 'rejected',
                'user_id': rejector_id,
                'timestamp': datetime.utcnow().isoformat(),
                'notes': notes
            })
            
            # Update approval record
            update_data = {
                'status': 'rejected',
                'approval_history': history,
                'rejected_at': datetime.utcnow().isoformat()
            }
            
            result = self.supabase.table('document_approvals').update(update_data).eq('id', approval_id).execute()
            
            # Update document status
            self.supabase.table('documents').update({'status': 'rejected'}).eq('id', approval_data['document_id']).execute()
            
            # Send rejection notification
            await self._send_approval_notification(approval_data['document_id'], None, 'document_rejected')
            
            return {"success": True, "data": result.data[0] if result.data else None}
            
        except Exception as e:
            logger.error(f"Error rejecting document: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_pending_approvals(self, user_id: str, company_id: str = None) -> Dict[str, Any]:
        """Get pending approvals for user"""
        try:
            query = self.supabase.table('document_approvals').select('''
                *, 
                documents (id, filename, file_size, upload_date, extracted_data),
                companies (name)
            ''').eq('current_approver_id', user_id).eq('status', 'pending')
            
            if company_id:
                query = query.eq('company_id', company_id)
            
            result = query.order('created_at', desc=False).execute()
            
            return {"success": True, "data": result.data}
            
        except Exception as e:
            logger.error(f"Error getting pending approvals: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_approval_history(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Get approval history for document"""
        try:
            # Check user access to document
            document = self.supabase.table('documents').select('company_id').eq('id', document_id).single().execute()
            if not document.data:
                return {"success": False, "error": "Document not found"}
            
            # Check user access to company
            access = self.supabase.table('company_users').select('id').eq('user_id', user_id).eq('company_id', document.data['company_id']).eq('is_active', True).execute()
            if not access.data:
                return {"success": False, "error": "Access denied"}
            
            # Get approval history
            result = self.supabase.table('document_approvals').select('*').eq('document_id', document_id).execute()
            
            return {"success": True, "data": result.data}
            
        except Exception as e:
            logger.error(f"Error getting approval history: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_company_approvals_stats(self, company_id: str, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get approval statistics for company"""
        try:
            # Check user access
            access = self.supabase.table('company_users').select('user_roles(can_view_analytics)').eq('user_id', user_id).eq('company_id', company_id).eq('is_active', True).single().execute()
            
            if not access.data or not access.data['user_roles']['can_view_analytics']:
                return {"success": False, "error": "Access denied"}
            
            # Get stats from last N days
            from_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
            
            # Total approvals
            total = self.supabase.table('document_approvals').select('id', count='exact').eq('company_id', company_id).gte('created_at', from_date).execute()
            
            # Approved
            approved = self.supabase.table('document_approvals').select('id', count='exact').eq('company_id', company_id).eq('status', 'approved').gte('created_at', from_date).execute()
            
            # Rejected
            rejected = self.supabase.table('document_approvals').select('id', count='exact').eq('company_id', company_id).eq('status', 'rejected').gte('created_at', from_date).execute()
            
            # Pending
            pending = self.supabase.table('document_approvals').select('id', count='exact').eq('company_id', company_id).eq('status', 'pending').execute()
            
            stats = {
                'total_approvals': total.count,
                'approved': approved.count,
                'rejected': rejected.count,
                'pending': pending.count,
                'approval_rate': (approved.count / total.count * 100) if total.count > 0 else 0
            }
            
            return {"success": True, "data": stats}
            
        except Exception as e:
            logger.error(f"Error getting approval stats: {str(e)}")
            return {"success": False, "error": str(e)}
    
    # ===== HELPER METHODS =====
    
    async def _get_workflow_steps(self, company_id: str) -> List[Dict[str, Any]]:
        """Get workflow steps for company"""
        # Default workflow steps
        return [
            {'step': 1, 'name': 'Manager Approval', 'required_role': 'manager'},
            {'step': 2, 'name': 'Financial Approval', 'required_role': 'accountant'},
            {'step': 3, 'name': 'Final Approval', 'required_role': 'admin'}
        ]
    
    async def _find_next_approver(self, company_id: str, step: int, document_id: str) -> Optional[str]:
        """Find next approver for workflow step"""
        try:
            workflow_steps = await self._get_workflow_steps(company_id)
            
            if step > len(workflow_steps):
                return None
            
            required_role = workflow_steps[step - 1]['required_role']
            
            # Find users with required role
            result = self.supabase.table('company_users').select('user_id').eq('company_id', company_id).eq('is_active', True).execute()
            
            # Filter by role
            role_result = self.supabase.table('user_roles').select('id').eq('name', required_role).single().execute()
            if not role_result.data:
                return None
            
            role_users = self.supabase.table('company_users').select('user_id').eq('company_id', company_id).eq('role_id', role_result.data['id']).eq('is_active', True).execute()
            
            if role_users.data:
                # Return first available approver
                return role_users.data[0]['user_id']
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding next approver: {str(e)}")
            return None
    
    async def _send_approval_notification(self, user_id: str, document_id: str, notification_type: str):
        """Send approval notification to user"""
        try:
            # TODO: Implement notification system (email, in-app, etc.)
            logger.info(f"Sending {notification_type} notification to {user_id} for document {document_id}")
            
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
