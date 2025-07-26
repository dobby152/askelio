from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from database.connection import get_db_connection
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.db = get_db_connection()

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
        query = text("""
            SELECT 
                COUNT(DISTINCT d.id) as total_documents,
                COUNT(DISTINCT CASE WHEN d.created_at >= :start_date THEN d.id END) as documents_this_period,
                COUNT(DISTINCT da.id) as total_approvals,
                COUNT(DISTINCT CASE WHEN da.status = 'pending' THEN da.id END) as pending_approvals,
                COUNT(DISTINCT cu.user_id) as active_users,
                COALESCE(SUM(d.file_size_bytes), 0) as total_storage_bytes,
                AVG(CASE WHEN da.completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (da.completed_at - da.created_at))/3600 
                    END) as avg_approval_time_hours
            FROM companies c
            LEFT JOIN documents d ON d.company_id = c.id 
            LEFT JOIN document_approvals da ON da.document_id = d.id
            LEFT JOIN company_users cu ON cu.company_id = c.id AND cu.is_active = true
            WHERE c.id = :company_id
        """)

        result = await self.db.fetch_one(query, {
            "company_id": company_id,
            "start_date": start_date
        })

        if result:
            return {
                "total_documents": result["total_documents"] or 0,
                "documents_this_period": result["documents_this_period"] or 0,
                "total_approvals": result["total_approvals"] or 0,
                "pending_approvals": result["pending_approvals"] or 0,
                "active_users": result["active_users"] or 0,
                "total_storage_gb": round((result["total_storage_bytes"] or 0) / (1024**3), 2),
                "avg_approval_time_hours": round(result["avg_approval_time_hours"] or 0, 1)
            }
        
        return {}

    async def _get_document_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get document-related analytics"""
        # Documents by type
        type_query = text("""
            SELECT 
                document_type,
                COUNT(*) as count,
                AVG(CASE WHEN total_amount IS NOT NULL THEN total_amount END) as avg_amount
            FROM documents 
            WHERE company_id = :company_id 
                AND created_at BETWEEN :start_date AND :end_date
            GROUP BY document_type
            ORDER BY count DESC
        """)

        type_results = await self.db.fetch_all(type_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Documents over time (daily)
        timeline_query = text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as total_amount
            FROM documents 
            WHERE company_id = :company_id 
                AND created_at BETWEEN :start_date AND :end_date
            GROUP BY DATE(created_at)
            ORDER BY date
        """)

        timeline_results = await self.db.fetch_all(timeline_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Top suppliers
        suppliers_query = text("""
            SELECT 
                supplier_name,
                COUNT(*) as document_count,
                SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as total_amount
            FROM documents 
            WHERE company_id = :company_id 
                AND created_at BETWEEN :start_date AND :end_date
                AND supplier_name IS NOT NULL
            GROUP BY supplier_name
            ORDER BY total_amount DESC
            LIMIT 10
        """)

        suppliers_results = await self.db.fetch_all(suppliers_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        return {
            "by_type": [dict(row) for row in type_results],
            "timeline": [dict(row) for row in timeline_results],
            "top_suppliers": [dict(row) for row in suppliers_results]
        }

    async def _get_approval_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get approval workflow analytics"""
        # Approval status distribution
        status_query = text("""
            SELECT 
                da.status,
                COUNT(*) as count,
                AVG(CASE WHEN da.completed_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (da.completed_at - da.created_at))/3600 
                    END) as avg_time_hours
            FROM document_approvals da
            JOIN documents d ON d.id = da.document_id
            WHERE d.company_id = :company_id 
                AND da.created_at BETWEEN :start_date AND :end_date
            GROUP BY da.status
        """)

        status_results = await self.db.fetch_all(status_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Approver performance
        approver_query = text("""
            SELECT 
                u.full_name as approver_name,
                u.email as approver_email,
                COUNT(das.id) as total_approvals,
                COUNT(CASE WHEN das.status = 'approved' THEN 1 END) as approved_count,
                COUNT(CASE WHEN das.status = 'rejected' THEN 1 END) as rejected_count,
                AVG(CASE WHEN das.approved_at IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (das.approved_at - da.created_at))/3600 
                    END) as avg_response_time_hours
            FROM document_approval_steps das
            JOIN document_approvals da ON da.id = das.approval_id
            JOIN documents d ON d.id = da.document_id
            JOIN auth.users u ON u.id = das.approver_id
            WHERE d.company_id = :company_id 
                AND da.created_at BETWEEN :start_date AND :end_date
            GROUP BY u.id, u.full_name, u.email
            ORDER BY total_approvals DESC
        """)

        approver_results = await self.db.fetch_all(approver_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Approval timeline
        timeline_query = text("""
            SELECT 
                DATE(da.created_at) as date,
                COUNT(*) as total_created,
                COUNT(CASE WHEN da.status = 'approved' THEN 1 END) as approved,
                COUNT(CASE WHEN da.status = 'rejected' THEN 1 END) as rejected,
                COUNT(CASE WHEN da.status = 'pending' THEN 1 END) as pending
            FROM document_approvals da
            JOIN documents d ON d.id = da.document_id
            WHERE d.company_id = :company_id 
                AND da.created_at BETWEEN :start_date AND :end_date
            GROUP BY DATE(da.created_at)
            ORDER BY date
        """)

        timeline_results = await self.db.fetch_all(timeline_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        return {
            "status_distribution": [dict(row) for row in status_results],
            "approver_performance": [dict(row) for row in approver_results],
            "timeline": [dict(row) for row in timeline_results]
        }

    async def _get_user_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user activity analytics"""
        # User activity
        activity_query = text("""
            SELECT 
                u.full_name as user_name,
                u.email as user_email,
                ur.display_name as role,
                COUNT(d.id) as documents_uploaded,
                COUNT(das.id) as approvals_made,
                MAX(d.created_at) as last_document_upload,
                MAX(das.approved_at) as last_approval_action
            FROM company_users cu
            JOIN auth.users u ON u.id = cu.user_id
            JOIN user_roles ur ON ur.id = cu.role_id
            LEFT JOIN documents d ON d.user_id = u.id AND d.created_at BETWEEN :start_date AND :end_date
            LEFT JOIN document_approval_steps das ON das.approver_id = u.id AND das.approved_at BETWEEN :start_date AND :end_date
            WHERE cu.company_id = :company_id AND cu.is_active = true
            GROUP BY u.id, u.full_name, u.email, ur.display_name
            ORDER BY documents_uploaded DESC, approvals_made DESC
        """)

        activity_results = await self.db.fetch_all(activity_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Role distribution
        role_query = text("""
            SELECT 
                ur.display_name as role,
                COUNT(*) as user_count
            FROM company_users cu
            JOIN user_roles ur ON ur.id = cu.role_id
            WHERE cu.company_id = :company_id AND cu.is_active = true
            GROUP BY ur.id, ur.display_name
            ORDER BY user_count DESC
        """)

        role_results = await self.db.fetch_all(role_query, {
            "company_id": company_id
        })

        return {
            "user_activity": [dict(row) for row in activity_results],
            "role_distribution": [dict(row) for row in role_results]
        }

    async def _get_storage_analytics(self, company_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get storage usage analytics"""
        storage_query = text("""
            SELECT 
                document_type,
                COUNT(*) as file_count,
                SUM(file_size_bytes) as total_bytes,
                AVG(file_size_bytes) as avg_file_size_bytes,
                MAX(file_size_bytes) as max_file_size_bytes
            FROM documents 
            WHERE company_id = :company_id 
                AND created_at BETWEEN :start_date AND :end_date
                AND file_size_bytes IS NOT NULL
            GROUP BY document_type
            ORDER BY total_bytes DESC
        """)

        storage_results = await self.db.fetch_all(storage_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        # Storage growth over time
        growth_query = text("""
            SELECT 
                DATE(created_at) as date,
                SUM(file_size_bytes) as daily_bytes_added,
                COUNT(*) as files_added
            FROM documents 
            WHERE company_id = :company_id 
                AND created_at BETWEEN :start_date AND :end_date
                AND file_size_bytes IS NOT NULL
            GROUP BY DATE(created_at)
            ORDER BY date
        """)

        growth_results = await self.db.fetch_all(growth_query, {
            "company_id": company_id,
            "start_date": start_date,
            "end_date": end_date
        })

        return {
            "by_type": [
                {
                    **dict(row),
                    "total_gb": round(row["total_bytes"] / (1024**3), 3),
                    "avg_file_size_mb": round(row["avg_file_size_bytes"] / (1024**2), 2),
                    "max_file_size_mb": round(row["max_file_size_bytes"] / (1024**2), 2)
                } for row in storage_results
            ],
            "growth_timeline": [
                {
                    **dict(row),
                    "daily_gb_added": round(row["daily_bytes_added"] / (1024**3), 3)
                } for row in growth_results
            ]
        }

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

        return trends

    async def _update_company_analytics_record(self, company_id: str, analytics: Dict[str, Any]) -> None:
        """Update the company_analytics table with latest data"""
        try:
            query = text("""
                INSERT INTO company_analytics (
                    company_id, 
                    total_documents, 
                    total_users, 
                    total_storage_gb,
                    pending_approvals,
                    avg_approval_time_hours,
                    last_updated
                ) VALUES (
                    :company_id,
                    :total_documents,
                    :total_users,
                    :total_storage_gb,
                    :pending_approvals,
                    :avg_approval_time_hours,
                    NOW()
                )
                ON CONFLICT (company_id) 
                DO UPDATE SET
                    total_documents = EXCLUDED.total_documents,
                    total_users = EXCLUDED.total_users,
                    total_storage_gb = EXCLUDED.total_storage_gb,
                    pending_approvals = EXCLUDED.pending_approvals,
                    avg_approval_time_hours = EXCLUDED.avg_approval_time_hours,
                    last_updated = NOW()
            """)

            overview = analytics.get("overview", {})
            await self.db.execute(query, {
                "company_id": company_id,
                "total_documents": overview.get("total_documents", 0),
                "total_users": overview.get("active_users", 0),
                "total_storage_gb": overview.get("total_storage_gb", 0),
                "pending_approvals": overview.get("pending_approvals", 0),
                "avg_approval_time_hours": overview.get("avg_approval_time_hours", 0)
            })

        except Exception as e:
            logger.error(f"Error updating company analytics record: {str(e)}")

    async def get_system_analytics(self) -> Dict[str, Any]:
        """Get system-wide analytics (admin only)"""
        try:
            query = text("""
                SELECT 
                    COUNT(DISTINCT c.id) as total_companies,
                    COUNT(DISTINCT cu.user_id) as total_users,
                    COUNT(DISTINCT d.id) as total_documents,
                    COUNT(DISTINCT da.id) as total_approvals,
                    SUM(COALESCE(d.file_size_bytes, 0)) as total_storage_bytes,
                    COUNT(DISTINCT CASE WHEN c.created_at >= NOW() - INTERVAL '30 days' THEN c.id END) as new_companies_30d,
                    COUNT(DISTINCT CASE WHEN d.created_at >= NOW() - INTERVAL '30 days' THEN d.id END) as new_documents_30d
                FROM companies c
                LEFT JOIN company_users cu ON cu.company_id = c.id AND cu.is_active = true
                LEFT JOIN documents d ON d.company_id = c.id
                LEFT JOIN document_approvals da ON da.document_id = d.id
            """)

            result = await self.db.fetch_one(query)

            if result:
                return {
                    "success": True,
                    "data": {
                        "total_companies": result["total_companies"] or 0,
                        "total_users": result["total_users"] or 0,
                        "total_documents": result["total_documents"] or 0,
                        "total_approvals": result["total_approvals"] or 0,
                        "total_storage_gb": round((result["total_storage_bytes"] or 0) / (1024**3), 2),
                        "new_companies_30d": result["new_companies_30d"] or 0,
                        "new_documents_30d": result["new_documents_30d"] or 0
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
