#!/usr/bin/env python3
"""
Enhanced Database Configuration
Supports both SQLite (development) and PostgreSQL (production)
"""

import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import psycopg2
from urllib.parse import urlparse

# Configure logging
logger = logging.getLogger(__name__)

class DatabaseConfig:
    def __init__(self):
        self.database_url = self._get_database_url()
        self.engine = self._create_engine()
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.Base = declarative_base()
    
    def _get_database_url(self) -> str:
        """Get database URL from environment or use SQLite default"""
        
        # Check for explicit database URL
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            logger.info(f"Using database URL from environment: {database_url[:20]}...")
            return database_url
        
        # Check for Cloud SQL connection
        if os.getenv('CLOUD_SQL_CONNECTION_NAME'):
            db_user = os.getenv('DB_USER', 'askelio')
            db_password = os.getenv('DB_PASSWORD')
            db_name = os.getenv('DB_NAME', 'askelio')
            connection_name = os.getenv('CLOUD_SQL_CONNECTION_NAME')
            
            if db_password:
                database_url = f"postgresql://{db_user}:{db_password}@/{db_name}?host=/cloudsql/{connection_name}"
                logger.info("Using Cloud SQL PostgreSQL connection")
                return database_url
        
        # Check for standard PostgreSQL connection
        if all([
            os.getenv('DB_HOST'),
            os.getenv('DB_USER'),
            os.getenv('DB_PASSWORD'),
            os.getenv('DB_NAME')
        ]):
            db_host = os.getenv('DB_HOST')
            db_port = os.getenv('DB_PORT', '5432')
            db_user = os.getenv('DB_USER')
            db_password = os.getenv('DB_PASSWORD')
            db_name = os.getenv('DB_NAME')
            
            database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
            logger.info("Using standard PostgreSQL connection")
            return database_url
        
        # Default to SQLite for development
        sqlite_file = os.getenv('SQLITE_FILE', 'askelio_flask.db')
        database_url = f"sqlite:///./{sqlite_file}"
        logger.info(f"Using SQLite database: {sqlite_file}")
        return database_url
    
    def _create_engine(self):
        """Create SQLAlchemy engine with appropriate configuration"""
        
        parsed_url = urlparse(self.database_url)
        
        if parsed_url.scheme.startswith('postgresql'):
            # PostgreSQL configuration
            engine = create_engine(
                self.database_url,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=os.getenv('SQL_DEBUG', 'false').lower() == 'true'
            )
            logger.info("Created PostgreSQL engine")
            
        elif parsed_url.scheme.startswith('sqlite'):
            # SQLite configuration
            engine = create_engine(
                self.database_url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=os.getenv('SQL_DEBUG', 'false').lower() == 'true'
            )
            
            # Enable foreign key constraints for SQLite
            @event.listens_for(engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
            
            logger.info("Created SQLite engine")
            
        else:
            raise ValueError(f"Unsupported database scheme: {parsed_url.scheme}")
        
        return engine
    
    def get_db(self):
        """Dependency to get database session"""
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    def init_db(self):
        """Create all tables"""
        try:
            self.Base.metadata.create_all(bind=self.engine)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise
    
    def test_connection(self):
        """Test database connection"""
        try:
            with self.engine.connect() as connection:
                if self.database_url.startswith('postgresql'):
                    result = connection.execute("SELECT version()")
                    version = result.fetchone()[0]
                    logger.info(f"PostgreSQL connection successful: {version}")
                else:
                    result = connection.execute("SELECT sqlite_version()")
                    version = result.fetchone()[0]
                    logger.info(f"SQLite connection successful: {version}")
                return True
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            return False
    
    def get_database_info(self):
        """Get database information"""
        parsed_url = urlparse(self.database_url)
        
        return {
            'type': 'PostgreSQL' if parsed_url.scheme.startswith('postgresql') else 'SQLite',
            'host': parsed_url.hostname or 'local',
            'database': parsed_url.path.lstrip('/') if parsed_url.path else 'unknown',
            'port': parsed_url.port or ('5432' if parsed_url.scheme.startswith('postgresql') else 'N/A')
        }

# Global database configuration instance
db_config = DatabaseConfig()

# Backward compatibility exports
engine = db_config.engine
SessionLocal = db_config.SessionLocal
Base = db_config.Base
get_db = db_config.get_db
init_db = db_config.init_db

# Health check function
def health_check():
    """Database health check for monitoring"""
    try:
        return db_config.test_connection()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Database info function
def get_db_info():
    """Get database information for debugging"""
    return db_config.get_database_info()
