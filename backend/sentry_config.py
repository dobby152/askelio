#!/usr/bin/env python3
"""
Sentry Configuration for Askelio Backend
Comprehensive error tracking and performance monitoring
"""

import os
import logging
from typing import Dict, Any, Optional

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    from sentry_sdk.integrations.redis import RedisIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    from sentry_sdk.integrations.asyncio import AsyncioIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    sentry_sdk = None

logger = logging.getLogger(__name__)

class SentryConfig:
    """Sentry configuration and initialization"""
    
    def __init__(self):
        self.dsn = os.getenv('SENTRY_DSN')
        self.environment = os.getenv('SENTRY_ENVIRONMENT', 'development')
        self.release = os.getenv('SENTRY_RELEASE', 'askelio@1.0.0')
        self.sample_rate = float(os.getenv('SENTRY_SAMPLE_RATE', '1.0'))
        self.traces_sample_rate = float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1'))
        self.profiles_sample_rate = float(os.getenv('SENTRY_PROFILES_SAMPLE_RATE', '0.1'))
        
        self.is_initialized = False
    
    def initialize(self) -> bool:
        """Initialize Sentry with comprehensive configuration"""
        if not SENTRY_AVAILABLE:
            logger.warning("⚠️ Sentry SDK not available - error monitoring disabled")
            return False
        
        if not self.dsn:
            logger.info("ℹ️ Sentry DSN not configured - error monitoring disabled")
            return False
        
        try:
            # Configure logging integration
            logging_integration = LoggingIntegration(
                level=logging.INFO,        # Capture info and above as breadcrumbs
                event_level=logging.ERROR  # Send errors as events
            )
            
            # Initialize Sentry
            sentry_sdk.init(
                dsn=self.dsn,
                environment=self.environment,
                release=self.release,
                sample_rate=self.sample_rate,
                traces_sample_rate=self.traces_sample_rate,
                profiles_sample_rate=self.profiles_sample_rate,
                
                # Integrations for comprehensive monitoring
                integrations=[
                    FastApiIntegration(auto_enabling_integrations=True),
                    SqlalchemyIntegration(),
                    RedisIntegration(),
                    logging_integration,
                    AsyncioIntegration(),
                ],
                
                # Performance monitoring
                enable_tracing=True,
                
                # Additional configuration
                attach_stacktrace=True,
                send_default_pii=False,  # Don't send personally identifiable information
                
                # Custom error filtering
                before_send=self._before_send_filter,
                before_send_transaction=self._before_send_transaction_filter,
                
                # Set user context
                initial_scope=self._configure_initial_scope,
            )
            
            self.is_initialized = True
            logger.info(f"✅ Sentry initialized (env: {self.environment}, release: {self.release})")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Sentry: {e}")
            return False
    
    def _before_send_filter(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filter events before sending to Sentry"""
        
        # Don't send certain types of errors
        if 'exc_info' in hint:
            exc_type, exc_value, tb = hint['exc_info']
            
            # Filter out common non-critical errors
            if exc_type.__name__ in [
                'ConnectionError',
                'TimeoutError', 
                'CancelledError',
                'KeyboardInterrupt'
            ]:
                return None
            
            # Filter out specific error messages
            error_message = str(exc_value).lower()
            if any(phrase in error_message for phrase in [
                'connection reset by peer',
                'broken pipe',
                'client disconnected',
                'task was cancelled'
            ]):
                return None
        
        # Add custom tags
        event.setdefault('tags', {}).update({
            'component': 'askelio-backend',
            'service': 'document-processing'
        })
        
        # Add custom context
        event.setdefault('extra', {}).update({
            'environment_info': {
                'python_version': os.sys.version,
                'platform': os.name,
            }
        })
        
        return event
    
    def _before_send_transaction_filter(self, event: Dict[str, Any], hint: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Filter performance transactions before sending"""
        
        # Don't send health check transactions
        if event.get('transaction') in ['/health', '/status', '/ping']:
            return None
        
        # Only send slow transactions in production
        if self.environment == 'production':
            duration = event.get('timestamp', 0) - event.get('start_timestamp', 0)
            if duration < 1.0:  # Less than 1 second
                return None
        
        return event
    
    def _configure_initial_scope(self) -> None:
        """Configure initial Sentry scope"""
        with sentry_sdk.configure_scope() as scope:
            scope.set_tag('service', 'askelio-backend')
            scope.set_tag('component', 'document-processor')
            scope.set_context('runtime', {
                'name': 'Python',
                'version': os.sys.version,
            })
    
    def capture_exception(self, exception: Exception, **kwargs) -> Optional[str]:
        """Capture an exception with additional context"""
        if not self.is_initialized:
            return None
        
        with sentry_sdk.configure_scope() as scope:
            # Add any additional context
            for key, value in kwargs.items():
                scope.set_extra(key, value)
            
            return sentry_sdk.capture_exception(exception)
    
    def capture_message(self, message: str, level: str = 'info', **kwargs) -> Optional[str]:
        """Capture a message with additional context"""
        if not self.is_initialized:
            return None
        
        with sentry_sdk.configure_scope() as scope:
            for key, value in kwargs.items():
                scope.set_extra(key, value)
            
            return sentry_sdk.capture_message(message, level=level)
    
    def set_user_context(self, user_id: str, email: Optional[str] = None, **kwargs):
        """Set user context for error tracking"""
        if not self.is_initialized:
            return
        
        with sentry_sdk.configure_scope() as scope:
            scope.set_user({
                'id': user_id,
                'email': email,
                **kwargs
            })
    
    def set_transaction_context(self, transaction_name: str, **kwargs):
        """Set transaction context for performance monitoring"""
        if not self.is_initialized:
            return
        
        with sentry_sdk.configure_scope() as scope:
            scope.set_transaction_name(transaction_name)
            for key, value in kwargs.items():
                scope.set_tag(key, value)
    
    def add_breadcrumb(self, message: str, category: str = 'custom', level: str = 'info', **data):
        """Add a breadcrumb for debugging context"""
        if not self.is_initialized:
            return
        
        sentry_sdk.add_breadcrumb(
            message=message,
            category=category,
            level=level,
            data=data
        )

# Global Sentry instance
sentry_config = SentryConfig()

# Convenience functions
def init_sentry() -> bool:
    """Initialize Sentry monitoring"""
    return sentry_config.initialize()

def capture_exception(exception: Exception, **kwargs) -> Optional[str]:
    """Capture an exception"""
    return sentry_config.capture_exception(exception, **kwargs)

def capture_message(message: str, level: str = 'info', **kwargs) -> Optional[str]:
    """Capture a message"""
    return sentry_config.capture_message(message, level, **kwargs)

def set_user_context(user_id: str, email: Optional[str] = None, **kwargs):
    """Set user context"""
    sentry_config.set_user_context(user_id, email, **kwargs)

def add_breadcrumb(message: str, category: str = 'custom', level: str = 'info', **data):
    """Add a breadcrumb"""
    sentry_config.add_breadcrumb(message, category, level, **data)

# Decorator for automatic error tracking
def track_errors(operation_name: str = None):
    """Decorator to automatically track errors in functions"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                if operation_name:
                    add_breadcrumb(f"Starting {operation_name}", category='operation')
                
                result = func(*args, **kwargs)
                
                if operation_name:
                    add_breadcrumb(f"Completed {operation_name}", category='operation')
                
                return result
                
            except Exception as e:
                capture_exception(e, 
                    function_name=func.__name__,
                    operation=operation_name or func.__name__,
                    args=str(args)[:200],  # Truncate long arguments
                    kwargs=str(kwargs)[:200]
                )
                raise
        
        return wrapper
    return decorator
