from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from services.supabase_client import SupabaseService
import logging

logger = logging.getLogger(__name__)

class AnalyticsService(SupabaseService):
    def __init__(self):
        super().__init__()

    async def get_company_analytics(
        self, 
        company_id: str, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get comprehensive analytics for a company"""
        try:
            if not start_date:
                start_date = datetime.now() - timedelta(days=30)
            if not end_date:
                end_date = datetime.now()

            analytics = {
                "overview": await self._get_overview_metrics(company_id, start_date, end_date),
                "documents": await self._get_document_analytics(company_id, start_date, end_date),
                "approvals": await self._get_approval_analytics(company_id, start_date, end_date),
                "users": await self._get_user_analytics(company_id, start_date, end_date),
                "storage": await self._get_storage_analytics(company_id, start_date, end_date),
                "trends": await self._get_trend_analytics(company_id, start_date, end_date)
            }

            # Update company_analytics table
            await self._update_company_analytics_record(company_id, analytics)

            return {
                "success": True,
                "data": analytics,
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error getting company analytics: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _get_overview_metrics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get high-level overview metrics"""
        try:
            # Get total documents for company
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('id, created_at, file_size_bytes')
                .eq('company_id', company_id)
                .execute()
            )

            if not docs_result["success"]:
                return {}

            documents = docs_result["data"] or []
            total_documents = len(documents)

            # Count documents in this period
            documents_this_period = len([
                d for d in documents
                if d.get('created_at') and datetime.fromisoformat(d['created_at'].replace('Z', '+00:00')) >= start_date
            ])

            # Calculate total storage
            total_storage_bytes = sum(d.get('file_size_bytes', 0) or 0 for d in documents)

            # Get approvals
            approvals_result = await self.execute_query(
                lambda: self.supabase.table('document_approvals')
                .select('id, status, created_at, completed_at, document_id')
                .execute()
            )

            approvals = []
            if approvals_result["success"] and approvals_result["data"]:
                # Filter approvals for documents belonging to this company
                doc_ids = [d['id'] for d in documents]
                approvals = [a for a in approvals_result["data"] if a.get('document_id') in doc_ids]

            total_approvals = len(approvals)
            pending_approvals = len([a for a in approvals if a.get('status') == 'pending'])

            # Calculate average approval time
            completed_approvals = [
                a for a in approvals
                if a.get('completed_at') and a.get('created_at')
            ]

            avg_approval_time_hours = 0
            if completed_approvals:
                total_hours = 0
                for approval in completed_approvals:
                    created = datetime.fromisoformat(approval['created_at'].replace('Z', '+00:00'))
                    completed = datetime.fromisoformat(approval['completed_at'].replace('Z', '+00:00'))
                    hours = (completed - created).total_seconds() / 3600
                    total_hours += hours
                avg_approval_time_hours = total_hours / len(completed_approvals)

            # Get active users
            users_result = await self.execute_query(
                lambda: self.supabase.table('company_users')
                .select('user_id')
                .eq('company_id', company_id)
                .eq('is_active', True)
                .execute()
            )

            active_users = len(users_result["data"] or []) if users_result["success"] else 0

            return {
                "total_documents": total_documents,
                "documents_this_period": documents_this_period,
                "total_approvals": total_approvals,
                "pending_approvals": pending_approvals,
                "active_users": active_users,
                "total_storage_gb": round(total_storage_bytes / (1024**3), 2),
                "avg_approval_time_hours": round(avg_approval_time_hours, 1)
            }

        except Exception as e:
            logger.error(f"Error getting overview metrics: {str(e)}")
            return {}

    async def _get_document_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get document-related analytics"""
        try:
            # Get documents for the period
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('*')
                .eq('company_id', company_id)
                .gte('created_at', start_date.isoformat())
                .lte('created_at', end_date.isoformat())
                .execute()
            )

            if not docs_result["success"]:
                return {"by_type": [], "timeline": [], "top_suppliers": []}

            documents = docs_result["data"] or []

            # Documents by type
            type_counts = {}
            type_amounts = {}

            for doc in documents:
                doc_type = doc.get('document_type', 'unknown')
                type_counts[doc_type] = type_counts.get(doc_type, 0) + 1

                if doc.get('total_amount'):
                    if doc_type not in type_amounts:
                        type_amounts[doc_type] = []
                    type_amounts[doc_type].append(float(doc['total_amount']))

            by_type = []
            for doc_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
                avg_amount = 0
                if doc_type in type_amounts and type_amounts[doc_type]:
                    avg_amount = sum(type_amounts[doc_type]) / len(type_amounts[doc_type])

                by_type.append({
                    "document_type": doc_type,
                    "count": count,
                    "avg_amount": round(avg_amount, 2)
                })

            # Timeline (daily aggregation)
            daily_counts = {}
            daily_amounts = {}

            for doc in documents:
                if doc.get('created_at'):
                    date_str = doc['created_at'][:10]  # Get YYYY-MM-DD part
                    daily_counts[date_str] = daily_counts.get(date_str, 0) + 1

                    amount = float(doc.get('total_amount', 0) or 0)
                    daily_amounts[date_str] = daily_amounts.get(date_str, 0) + amount

            timeline = []
            for date_str in sorted(daily_counts.keys()):
                timeline.append({
                    "date": date_str,
                    "count": daily_counts[date_str],
                    "total_amount": round(daily_amounts.get(date_str, 0), 2)
                })

            # Top suppliers
            supplier_counts = {}
            supplier_amounts = {}

            for doc in documents:
                supplier = doc.get('supplier_name')
                if supplier:
                    supplier_counts[supplier] = supplier_counts.get(supplier, 0) + 1
                    amount = float(doc.get('total_amount', 0) or 0)
                    supplier_amounts[supplier] = supplier_amounts.get(supplier, 0) + amount

            top_suppliers = []
            for supplier, amount in sorted(supplier_amounts.items(), key=lambda x: x[1], reverse=True)[:10]:
                top_suppliers.append({
                    "supplier_name": supplier,
                    "document_count": supplier_counts[supplier],
                    "total_amount": round(amount, 2)
                })

            return {
                "by_type": by_type,
                "timeline": timeline,
                "top_suppliers": top_suppliers
            }

        except Exception as e:
            logger.error(f"Error getting document analytics: {str(e)}")
            return {"by_type": [], "timeline": [], "top_suppliers": []}

    async def _get_approval_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get approval workflow analytics"""
        try:
            # Get documents for this company first
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('id')
                .eq('company_id', company_id)
                .execute()
            )

            if not docs_result["success"]:
                return {"status_distribution": [], "approver_performance": [], "timeline": []}

            doc_ids = [d['id'] for d in (docs_result["data"] or [])]
            if not doc_ids:
                return {"status_distribution": [], "approver_performance": [], "timeline": []}

            # Get approvals for these documents in the time period
            approvals_result = await self.execute_query(
                lambda: self.supabase.table('document_approvals')
                .select('*')
                .in_('document_id', doc_ids)
                .gte('created_at', start_date.isoformat())
                .lte('created_at', end_date.isoformat())
                .execute()
            )

            approvals = approvals_result["data"] or [] if approvals_result["success"] else []

            # Status distribution
            status_counts = {}
            status_times = {}

            for approval in approvals:
                status = approval.get('status', 'unknown')
                status_counts[status] = status_counts.get(status, 0) + 1

                if approval.get('completed_at') and approval.get('created_at'):
                    created = datetime.fromisoformat(approval['created_at'].replace('Z', '+00:00'))
                    completed = datetime.fromisoformat(approval['completed_at'].replace('Z', '+00:00'))
                    hours = (completed - created).total_seconds() / 3600

                    if status not in status_times:
                        status_times[status] = []
                    status_times[status].append(hours)

            status_distribution = []
            for status, count in status_counts.items():
                avg_time = 0
                if status in status_times and status_times[status]:
                    avg_time = sum(status_times[status]) / len(status_times[status])

                status_distribution.append({
                    "status": status,
                    "count": count,
                    "avg_time_hours": round(avg_time, 1)
                })

            # Timeline (daily aggregation)
            daily_stats = {}

            for approval in approvals:
                if approval.get('created_at'):
                    date_str = approval['created_at'][:10]
                    if date_str not in daily_stats:
                        daily_stats[date_str] = {
                            "total_created": 0,
                            "approved": 0,
                            "rejected": 0,
                            "pending": 0
                        }

                    daily_stats[date_str]["total_created"] += 1
                    status = approval.get('status', 'pending')
                    if status in daily_stats[date_str]:
                        daily_stats[date_str][status] += 1

            timeline = []
            for date_str in sorted(daily_stats.keys()):
                timeline.append({
                    "date": date_str,
                    **daily_stats[date_str]
                })

            # For approver performance, we need approval steps data
            # Since we don't have that table structure yet, return empty for now
            approver_performance = []

            return {
                "status_distribution": status_distribution,
                "approver_performance": approver_performance,
                "timeline": timeline
            }

        except Exception as e:
            logger.error(f"Error getting approval analytics: {str(e)}")
            return {"status_distribution": [], "approver_performance": [], "timeline": []}

    async def _get_user_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user activity analytics"""
        try:
            # Get company users
            users_result = await self.execute_query(
                lambda: self.supabase.table('company_users')
                .select('user_id, role_id')
                .eq('company_id', company_id)
                .eq('is_active', True)
                .execute()
            )

            if not users_result["success"]:
                return {"user_activity": [], "role_distribution": []}

            company_users = users_result["data"] or []
            user_ids = [u['user_id'] for u in company_users]

            if not user_ids:
                return {"user_activity": [], "role_distribution": []}

            # Get user details
            user_details_result = await self.execute_query(
                lambda: self.supabase.table('users')
                .select('id, full_name, email')
                .in_('id', user_ids)
                .execute()
            )

            user_details = {}
            if user_details_result["success"] and user_details_result["data"]:
                for user in user_details_result["data"]:
                    user_details[user['id']] = user

            # Get user roles
            role_ids = list(set(u['role_id'] for u in company_users))
            roles_result = await self.execute_query(
                lambda: self.supabase.table('user_roles')
                .select('id, display_name')
                .in_('id', role_ids)
                .execute()
            )

            roles = {}
            if roles_result["success"] and roles_result["data"]:
                for role in roles_result["data"]:
                    roles[role['id']] = role['display_name']

            # Get documents uploaded by users in period
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('user_id, created_at')
                .in_('user_id', user_ids)
                .gte('created_at', start_date.isoformat())
                .lte('created_at', end_date.isoformat())
                .execute()
            )

            user_doc_counts = {}
            user_last_upload = {}
            if docs_result["success"] and docs_result["data"]:
                for doc in docs_result["data"]:
                    user_id = doc['user_id']
                    user_doc_counts[user_id] = user_doc_counts.get(user_id, 0) + 1

                    if user_id not in user_last_upload or doc['created_at'] > user_last_upload[user_id]:
                        user_last_upload[user_id] = doc['created_at']

            # Build user activity
            user_activity = []
            for company_user in company_users:
                user_id = company_user['user_id']
                user_info = user_details.get(user_id, {})
                role_name = roles.get(company_user['role_id'], 'Unknown')

                user_activity.append({
                    "user_name": user_info.get('full_name', 'Unknown'),
                    "user_email": user_info.get('email', 'Unknown'),
                    "role": role_name,
                    "documents_uploaded": user_doc_counts.get(user_id, 0),
                    "approvals_made": 0,  # Would need approval_steps table
                    "last_document_upload": user_last_upload.get(user_id),
                    "last_approval_action": None
                })

            # Sort by documents uploaded
            user_activity.sort(key=lambda x: x['documents_uploaded'], reverse=True)

            # Role distribution
            role_counts = {}
            for company_user in company_users:
                role_name = roles.get(company_user['role_id'], 'Unknown')
                role_counts[role_name] = role_counts.get(role_name, 0) + 1

            role_distribution = []
            for role, count in sorted(role_counts.items(), key=lambda x: x[1], reverse=True):
                role_distribution.append({
                    "role": role,
                    "user_count": count
                })

            return {
                "user_activity": user_activity,
                "role_distribution": role_distribution
            }

        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            return {"user_activity": [], "role_distribution": []}

    async def _get_storage_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get storage usage analytics"""
        try:
            # Get documents for the period
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('document_type, file_size_bytes, created_at')
                .eq('company_id', company_id)
                .gte('created_at', start_date.isoformat())
                .lte('created_at', end_date.isoformat())
                .execute()
            )

            if not docs_result["success"]:
                return {"by_type": [], "growth_timeline": []}

            documents = docs_result["data"] or []

            # Storage by document type
            type_stats = {}

            for doc in documents:
                doc_type = doc.get('document_type', 'unknown')
                file_size = doc.get('file_size_bytes', 0) or 0

                if doc_type not in type_stats:
                    type_stats[doc_type] = {
                        "file_count": 0,
                        "total_bytes": 0,
                        "sizes": []
                    }

                type_stats[doc_type]["file_count"] += 1
                type_stats[doc_type]["total_bytes"] += file_size
                if file_size > 0:
                    type_stats[doc_type]["sizes"].append(file_size)

            by_type = []
            for doc_type, stats in sorted(type_stats.items(), key=lambda x: x[1]["total_bytes"], reverse=True):
                avg_bytes = sum(stats["sizes"]) / len(stats["sizes"]) if stats["sizes"] else 0
                max_bytes = max(stats["sizes"]) if stats["sizes"] else 0

                by_type.append({
                    "document_type": doc_type,
                    "file_count": stats["file_count"],
                    "total_bytes": stats["total_bytes"],
                    "avg_file_size_bytes": round(avg_bytes, 0),
                    "max_file_size_bytes": max_bytes,
                    "total_gb": round(stats["total_bytes"] / (1024**3), 3),
                    "avg_file_size_mb": round(avg_bytes / (1024**2), 2),
                    "max_file_size_mb": round(max_bytes / (1024**2), 2)
                })

            # Storage growth timeline
            daily_stats = {}

            for doc in documents:
                if doc.get('created_at'):
                    date_str = doc['created_at'][:10]
                    file_size = doc.get('file_size_bytes', 0) or 0

                    if date_str not in daily_stats:
                        daily_stats[date_str] = {
                            "files_added": 0,
                            "daily_bytes_added": 0
                        }

                    daily_stats[date_str]["files_added"] += 1
                    daily_stats[date_str]["daily_bytes_added"] += file_size

            growth_timeline = []
            for date_str in sorted(daily_stats.keys()):
                stats = daily_stats[date_str]

                growth_timeline.append({
                    "date": date_str,
                    "files_added": stats["files_added"],
                    "daily_bytes_added": stats["daily_bytes_added"],
                    "daily_gb_added": round(stats["daily_bytes_added"] / (1024**3), 3)
                })

            return {
                "by_type": by_type,
                "growth_timeline": growth_timeline
            }

        except Exception as e:
            logger.error(f"Error getting storage analytics: {str(e)}")
            return {"by_type": [], "growth_timeline": []}

    async def _get_trend_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get trend analysis and predictions"""
        # Compare with previous period
        period_days = (end_date - start_date).days
        prev_start = start_date - timedelta(days=period_days)
        prev_end = start_date

        current_metrics = await self._get_overview_metrics(company_id, start_date, end_date)
        previous_metrics = await self._get_overview_metrics(company_id, prev_start, prev_end)

        trends = {}
        for key in current_metrics:
            current_val = current_metrics.get(key, 0)
            previous_val = previous_metrics.get(key, 0)

            if previous_val > 0:
                change_percent = ((current_val - previous_val) / previous_val) * 100
            else:
                change_percent = 100 if current_val > 0 else 0

            trends[key] = {
                "current": current_val,
                "previous": previous_val,
                "change_percent": round(change_percent, 1),
                "trend": "up" if change_percent > 0 else "down" if change_percent < 0 else "stable"
            }

        # Get monthly data for charts
        monthly_data = await self._get_monthly_data(company_id, start_date, end_date)

        # Get expense categories for pie chart
        expense_categories = await self._get_expense_categories(company_id, start_date, end_date)

        return {
            **trends,
            "monthly_data": monthly_data,
            "expense_categories": expense_categories
        }

    async def _update_company_analytics_record(self, company_id: str, analytics: Dict[str, Any]) -> None:
        """Update the company_analytics table with latest data"""
        try:
            overview = analytics.get("overview", {})

            # Prepare data for upsert
            analytics_data = {
                "company_id": company_id,
                "total_documents": overview.get("total_documents", 0),
                "total_users": overview.get("active_users", 0),
                "total_storage_gb": overview.get("total_storage_gb", 0),
                "pending_approvals": overview.get("pending_approvals", 0),
                "avg_approval_time_hours": overview.get("avg_approval_time_hours", 0),
                "last_updated": datetime.utcnow().isoformat()
            }

            # Try to update existing record first
            update_result = await self.execute_query(
                lambda: self.supabase.table('company_analytics')
                .update(analytics_data)
                .eq('company_id', company_id)
                .execute()
            )

            # If no rows were updated, insert new record
            if update_result["success"] and not update_result["data"]:
                await self.execute_query(
                    lambda: self.supabase.table('company_analytics')
                    .insert(analytics_data)
                    .execute()
                )

        except Exception as e:
            logger.error(f"Error updating company analytics record: {str(e)}")

    async def get_system_analytics(self) -> Dict[str, Any]:
        """Get system-wide analytics (admin only)"""
        try:
            # Get all companies
            companies_result = await self.execute_query(
                lambda: self.supabase.table('companies').select('id, created_at').execute()
            )

            companies = companies_result["data"] or [] if companies_result["success"] else []
            total_companies = len(companies)

            # Count new companies in last 30 days
            thirty_days_ago = datetime.utcnow() - timedelta(days=30)
            new_companies_30d = len([
                c for c in companies
                if c.get('created_at') and datetime.fromisoformat(c['created_at'].replace('Z', '+00:00')) >= thirty_days_ago
            ])

            # Get all active users
            users_result = await self.execute_query(
                lambda: self.supabase.table('company_users')
                .select('user_id')
                .eq('is_active', True)
                .execute()
            )

            total_users = len(set(u['user_id'] for u in (users_result["data"] or []))) if users_result["success"] else 0

            # Get all documents
            docs_result = await self.execute_query(
                lambda: self.supabase.table('documents')
                .select('id, created_at, file_size_bytes')
                .execute()
            )

            documents = docs_result["data"] or [] if docs_result["success"] else []
            total_documents = len(documents)

            # Calculate storage and new documents
            total_storage_bytes = sum(d.get('file_size_bytes', 0) or 0 for d in documents)
            new_documents_30d = len([
                d for d in documents
                if d.get('created_at') and datetime.fromisoformat(d['created_at'].replace('Z', '+00:00')) >= thirty_days_ago
            ])

            # Get all approvals
            approvals_result = await self.execute_query(
                lambda: self.supabase.table('document_approvals').select('id').execute()
            )

            total_approvals = len(approvals_result["data"] or []) if approvals_result["success"] else 0

            return {
                "success": True,
                "data": {
                    "total_companies": total_companies,
                    "total_users": total_users,
                    "total_documents": total_documents,
                    "total_approvals": total_approvals,
                    "total_storage_gb": round(total_storage_bytes / (1024**3), 2),
                    "new_companies_30d": new_companies_30d,
                    "new_documents_30d": new_documents_30d
                }
            }

        except Exception as e:
            logger.error(f"Error getting system analytics: {str(e)}")
            return {"success": False, "error": str(e)}

    async def export_analytics(
        self, 
        company_id: str, 
        format: str = "csv",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Export analytics data in specified format"""
        try:
            analytics = await self.get_company_analytics(company_id, start_date, end_date)
            
            if not analytics["success"]:
                return analytics

            # Generate export data based on format
            if format.lower() == "csv":
                return await self._export_to_csv(analytics["data"])
            elif format.lower() == "json":
                return {
                    "success": True,
                    "data": analytics["data"],
                    "format": "json"
                }
            else:
                return {"success": False, "error": "Unsupported export format"}

        except Exception as e:
            logger.error(f"Error exporting analytics: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _export_to_csv(self, analytics_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert analytics data to CSV format"""
        import csv
        import io
        
        try:
            output = io.StringIO()
            
            # Overview metrics
            writer = csv.writer(output)
            writer.writerow(["Analytics Export"])
            writer.writerow([])
            writer.writerow(["Overview Metrics"])
            writer.writerow(["Metric", "Value"])
            
            overview = analytics_data.get("overview", {})
            for key, value in overview.items():
                writer.writerow([key.replace("_", " ").title(), value])
            
            writer.writerow([])
            writer.writerow(["Document Analytics by Type"])
            writer.writerow(["Document Type", "Count", "Average Amount"])
            
            for doc_type in analytics_data.get("documents", {}).get("by_type", []):
                writer.writerow([
                    doc_type.get("document_type", ""),
                    doc_type.get("count", 0),
                    doc_type.get("avg_amount", 0)
                ])
            
            csv_content = output.getvalue()
            output.close()
            
            return {
                "success": True,
                "data": csv_content,
                "format": "csv",
                "filename": f"analytics_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }
            
        except Exception as e:
            logger.error(f"Error creating CSV export: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _get_monthly_data(self, company_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get monthly financial data for charts"""
        try:
            # Get last 6 months of data
            monthly_data = []
            current_date = end_date

            for i in range(6):
                month_start = current_date.replace(day=1)
                if month_start.month == 1:
                    month_end = month_start.replace(year=month_start.year, month=12, day=31)
                else:
                    month_end = month_start.replace(month=month_start.month - 1, day=1) - timedelta(days=1)

                # Get metrics for this month
                month_metrics = await self._get_overview_metrics(company_id, month_start, month_end)

                # Czech month names
                czech_months = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer",
                               "Čvc", "Srp", "Zář", "Říj", "Lis", "Pro"]

                monthly_data.insert(0, {
                    "month": czech_months[current_date.month - 1],
                    "income": month_metrics.get('total_income', 0),
                    "expenses": month_metrics.get('total_expenses', 0),
                    "profit": month_metrics.get('net_profit', 0)
                })

                # Move to previous month
                if current_date.month == 1:
                    current_date = current_date.replace(year=current_date.year - 1, month=12)
                else:
                    current_date = current_date.replace(month=current_date.month - 1)

            return monthly_data

        except Exception as e:
            logger.error(f"Error getting monthly data: {e}")
            return []

    async def _get_expense_categories(self, company_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get expense categories for pie chart"""
        try:
            # Query documents with extracted fields for expense categories
            result = self.supabase.table('documents').select('''
                id, extracted_fields
            ''').eq('company_id', company_id).gte('created_at', start_date.isoformat()).lte('created_at', end_date.isoformat()).execute()

            if not result.data:
                return []

            # Analyze categories from extracted fields
            categories = {}
            total_amount = 0

            for doc in result.data:
                if not doc.get('extracted_fields'):
                    continue

                category = "Ostatní"
                amount = 0

                for field in doc['extracted_fields']:
                    if field.get('field_name') == 'category' and field.get('field_value'):
                        category = field['field_value']
                    elif field.get('field_name') == 'total_amount' and field.get('field_value'):
                        try:
                            amount = float(field['field_value'])
                        except:
                            amount = 0

                if amount > 0:
                    categories[category] = categories.get(category, 0) + amount
                    total_amount += amount

            # Convert to percentage format
            category_list = []
            colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

            for i, (category, amount) in enumerate(categories.items()):
                percentage = (amount / total_amount * 100) if total_amount > 0 else 0
                category_list.append({
                    "category": category,
                    "amount": amount,
                    "percentage": round(percentage, 1),
                    "color": colors[i % len(colors)]
                })

            return sorted(category_list, key=lambda x: x['amount'], reverse=True)

        except Exception as e:
            logger.error(f"Error getting expense categories: {e}")
            return []


# Create global instance
analytics_service = AnalyticsService()
