"""
LLM Performance Monitoring and Cost Tracking System
Real-time monitoring of model performance, costs, and optimization
"""

import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import sqlite3
import threading

logger = logging.getLogger(__name__)

@dataclass
class ModelMetrics:
    """Metrics for individual model performance"""
    model_name: str
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_cost_usd: float = 0.0
    total_tokens_input: int = 0
    total_tokens_output: int = 0
    avg_response_time: float = 0.0
    accuracy_scores: List[float] = None
    last_used: Optional[datetime] = None
    
    def __post_init__(self):
        if self.accuracy_scores is None:
            self.accuracy_scores = []
    
    @property
    def success_rate(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.successful_requests / self.total_requests
    
    @property
    def avg_accuracy(self) -> float:
        if not self.accuracy_scores:
            return 0.0
        return sum(self.accuracy_scores) / len(self.accuracy_scores)
    
    @property
    def cost_per_request(self) -> float:
        if self.total_requests == 0:
            return 0.0
        return self.total_cost_usd / self.total_requests

class LLMMonitor:
    """
    Comprehensive LLM monitoring system
    Tracks performance, costs, and provides optimization insights
    """
    
    def __init__(self, db_path: str = "llm_metrics.db"):
        self.db_path = db_path
        self.metrics: Dict[str, ModelMetrics] = {}
        self.daily_costs: Dict[str, float] = {}  # date -> cost_usd
        self.monthly_costs: Dict[str, float] = {}  # month -> cost_usd
        self.lock = threading.Lock()
        
        self._init_database()
        self._load_metrics()
        
        logger.info("🔍 LLM Monitor initialized")
    
    def _init_database(self):
        """Initialize SQLite database for persistent metrics"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS model_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    model_name TEXT NOT NULL,
                    request_success BOOLEAN,
                    cost_usd REAL,
                    tokens_input INTEGER,
                    tokens_output INTEGER,
                    response_time REAL,
                    accuracy_score REAL,
                    document_type TEXT,
                    language TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS daily_costs (
                    date TEXT PRIMARY KEY,
                    total_cost_usd REAL,
                    total_requests INTEGER
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_model_timestamp 
                ON model_metrics(model_name, timestamp)
            """)
    
    def _load_metrics(self):
        """Load existing metrics from database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Load model metrics
                cursor = conn.execute("""
                    SELECT model_name, 
                           COUNT(*) as total_requests,
                           SUM(CASE WHEN request_success THEN 1 ELSE 0 END) as successful,
                           SUM(cost_usd) as total_cost,
                           SUM(tokens_input) as total_input,
                           SUM(tokens_output) as total_output,
                           AVG(response_time) as avg_time,
                           MAX(timestamp) as last_used
                    FROM model_metrics 
                    GROUP BY model_name
                """)
                
                for row in cursor.fetchall():
                    model_name = row[0]
                    self.metrics[model_name] = ModelMetrics(
                        model_name=model_name,
                        total_requests=row[1],
                        successful_requests=row[2],
                        failed_requests=row[1] - row[2],
                        total_cost_usd=row[3] or 0.0,
                        total_tokens_input=row[4] or 0,
                        total_tokens_output=row[5] or 0,
                        avg_response_time=row[6] or 0.0,
                        last_used=datetime.fromisoformat(row[7]) if row[7] else None
                    )
                
                # Load daily costs
                cursor = conn.execute("SELECT date, total_cost_usd FROM daily_costs")
                for date, cost in cursor.fetchall():
                    self.daily_costs[date] = cost
                    
        except Exception as e:
            logger.warning(f"Failed to load metrics: {e}")
    
    def record_request(self, model_name: str, success: bool, cost_usd: float,
                      tokens_input: int, tokens_output: int, response_time: float,
                      accuracy_score: Optional[float] = None, document_type: str = "",
                      language: str = ""):
        """Record a model request with all metrics"""
        with self.lock:
            # Update in-memory metrics
            if model_name not in self.metrics:
                self.metrics[model_name] = ModelMetrics(model_name=model_name)
            
            metrics = self.metrics[model_name]
            metrics.total_requests += 1
            if success:
                metrics.successful_requests += 1
            else:
                metrics.failed_requests += 1
            
            metrics.total_cost_usd += cost_usd
            metrics.total_tokens_input += tokens_input
            metrics.total_tokens_output += tokens_output
            
            # Update average response time
            if metrics.total_requests == 1:
                metrics.avg_response_time = response_time
            else:
                metrics.avg_response_time = (
                    (metrics.avg_response_time * (metrics.total_requests - 1) + response_time) 
                    / metrics.total_requests
                )
            
            if accuracy_score is not None:
                metrics.accuracy_scores.append(accuracy_score)
                # Keep only last 100 scores to prevent memory bloat
                if len(metrics.accuracy_scores) > 100:
                    metrics.accuracy_scores = metrics.accuracy_scores[-100:]
            
            metrics.last_used = datetime.now()
            
            # Update daily costs
            today = datetime.now().strftime("%Y-%m-%d")
            self.daily_costs[today] = self.daily_costs.get(today, 0.0) + cost_usd
            
            # Persist to database
            self._persist_request(model_name, success, cost_usd, tokens_input, 
                                tokens_output, response_time, accuracy_score,
                                document_type, language)
    
    def _persist_request(self, model_name: str, success: bool, cost_usd: float,
                        tokens_input: int, tokens_output: int, response_time: float,
                        accuracy_score: Optional[float], document_type: str, language: str):
        """Persist request data to database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("""
                    INSERT INTO model_metrics 
                    (model_name, request_success, cost_usd, tokens_input, tokens_output,
                     response_time, accuracy_score, document_type, language)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (model_name, success, cost_usd, tokens_input, tokens_output,
                      response_time, accuracy_score, document_type, language))
                
                # Update daily costs
                today = datetime.now().strftime("%Y-%m-%d")
                conn.execute("""
                    INSERT OR REPLACE INTO daily_costs (date, total_cost_usd, total_requests)
                    VALUES (?, ?, (
                        SELECT COUNT(*) FROM model_metrics 
                        WHERE DATE(timestamp) = ?
                    ))
                """, (today, self.daily_costs[today], today))
                
        except Exception as e:
            logger.error(f"Failed to persist metrics: {e}")
    
    def get_daily_cost(self, date: Optional[str] = None) -> float:
        """Get total cost for specific date (default: today)"""
        if date is None:
            date = datetime.now().strftime("%Y-%m-%d")
        return self.daily_costs.get(date, 0.0)
    
    def get_monthly_cost(self, month: Optional[str] = None) -> float:
        """Get total cost for specific month (default: current month)"""
        if month is None:
            month = datetime.now().strftime("%Y-%m")
        
        total = 0.0
        for date, cost in self.daily_costs.items():
            if date.startswith(month):
                total += cost
        return total
    
    def get_model_performance(self, model_name: str) -> Optional[ModelMetrics]:
        """Get performance metrics for specific model"""
        return self.metrics.get(model_name)
    
    def get_best_model(self, criteria: str = "cost_efficiency") -> Optional[str]:
        """Get best performing model based on criteria"""
        if not self.metrics:
            return None
        
        if criteria == "cost_efficiency":
            # Best cost per successful request
            best_model = min(
                self.metrics.keys(),
                key=lambda m: self.metrics[m].cost_per_request if self.metrics[m].success_rate > 0.8 else float('inf')
            )
        elif criteria == "accuracy":
            best_model = max(
                self.metrics.keys(),
                key=lambda m: self.metrics[m].avg_accuracy
            )
        elif criteria == "speed":
            best_model = min(
                self.metrics.keys(),
                key=lambda m: self.metrics[m].avg_response_time if self.metrics[m].avg_response_time > 0 else float('inf')
            )
        else:  # success_rate
            best_model = max(
                self.metrics.keys(),
                key=lambda m: self.metrics[m].success_rate
            )
        
        return best_model
    
    def get_optimization_recommendations(self) -> List[str]:
        """Get recommendations for optimization"""
        recommendations = []
        
        # Check daily cost limits
        today_cost = self.get_daily_cost()
        if today_cost > 2.0:  # $2 USD daily limit
            recommendations.append(f"⚠️ Daily cost ${today_cost:.2f} exceeds recommended limit")
        
        # Check model performance
        for model_name, metrics in self.metrics.items():
            if metrics.success_rate < 0.8 and metrics.total_requests > 10:
                recommendations.append(f"🔴 {model_name} has low success rate: {metrics.success_rate:.1%}")
            
            if metrics.cost_per_request > 0.05:  # $0.05 per request
                recommendations.append(f"💰 {model_name} is expensive: ${metrics.cost_per_request:.3f} per request")
        
        # Suggest best models
        best_cost = self.get_best_model("cost_efficiency")
        best_accuracy = self.get_best_model("accuracy")
        
        if best_cost:
            recommendations.append(f"💡 Most cost-efficient: {best_cost}")
        if best_accuracy and best_accuracy != best_cost:
            recommendations.append(f"🎯 Most accurate: {best_accuracy}")
        
        return recommendations
    
    def export_metrics(self, filepath: str):
        """Export metrics to JSON file"""
        export_data = {
            "timestamp": datetime.now().isoformat(),
            "models": {name: asdict(metrics) for name, metrics in self.metrics.items()},
            "daily_costs": self.daily_costs,
            "monthly_cost": self.get_monthly_cost(),
            "recommendations": self.get_optimization_recommendations()
        }
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info(f"📊 Metrics exported to {filepath}")

# Global monitor instance
llm_monitor = LLMMonitor()
