#!/usr/bin/env python3
"""
Google Cloud Storage Integration
Handles file uploads, downloads, and management for Askelio
"""

import os
import logging
import tempfile
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from google.cloud import storage
from google.cloud.exceptions import NotFound, GoogleCloudError
import mimetypes

# Configure logging
logger = logging.getLogger(__name__)

class CloudStorageManager:
    def __init__(self):
        self.client = None
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
        self.uploads_bucket_name = os.getenv('UPLOADS_BUCKET')
        self.exports_bucket_name = os.getenv('EXPORTS_BUCKET')
        self.storage_bucket_name = os.getenv('STORAGE_BUCKET')
        
        # Initialize client if credentials are available
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Google Cloud Storage client"""
        try:
            # Check if running in Google Cloud environment
            if os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or os.getenv('GOOGLE_CLOUD_PROJECT'):
                self.client = storage.Client(project=self.project_id)
                logger.info("Google Cloud Storage client initialized")
            else:
                logger.warning("Google Cloud Storage credentials not found, using local storage")
        except Exception as e:
            logger.error(f"Failed to initialize Cloud Storage client: {e}")
            self.client = None
    
    def is_enabled(self) -> bool:
        """Check if Cloud Storage is enabled and configured"""
        return self.client is not None and all([
            self.uploads_bucket_name,
            self.exports_bucket_name
        ])
    
    def upload_file(self, file_content: bytes, filename: str, content_type: str = None, bucket_type: str = 'uploads') -> Optional[str]:
        """
        Upload file to Cloud Storage
        
        Args:
            file_content: File content as bytes
            filename: Name of the file
            content_type: MIME type of the file
            bucket_type: Type of bucket ('uploads', 'exports', 'storage')
        
        Returns:
            Public URL of uploaded file or None if failed
        """
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot upload file")
            return None
        
        try:
            # Select bucket based on type
            bucket_name = self._get_bucket_name(bucket_type)
            if not bucket_name:
                logger.error(f"Invalid bucket type: {bucket_type}")
                return None
            
            bucket = self.client.bucket(bucket_name)
            
            # Generate unique filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{timestamp}_{filename}"
            
            # Create blob and upload
            blob = bucket.blob(unique_filename)
            
            # Set content type
            if not content_type:
                content_type, _ = mimetypes.guess_type(filename)
            if content_type:
                blob.content_type = content_type
            
            # Upload file
            blob.upload_from_string(file_content)
            
            # Make blob publicly readable
            blob.make_public()
            
            logger.info(f"File uploaded successfully: {unique_filename}")
            return blob.public_url
            
        except Exception as e:
            logger.error(f"Failed to upload file {filename}: {e}")
            return None
    
    def download_file(self, filename: str, bucket_type: str = 'uploads') -> Optional[bytes]:
        """
        Download file from Cloud Storage
        
        Args:
            filename: Name of the file to download
            bucket_type: Type of bucket ('uploads', 'exports', 'storage')
        
        Returns:
            File content as bytes or None if failed
        """
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot download file")
            return None
        
        try:
            bucket_name = self._get_bucket_name(bucket_type)
            if not bucket_name:
                logger.error(f"Invalid bucket type: {bucket_type}")
                return None
            
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(filename)
            
            if not blob.exists():
                logger.error(f"File not found: {filename}")
                return None
            
            content = blob.download_as_bytes()
            logger.info(f"File downloaded successfully: {filename}")
            return content
            
        except Exception as e:
            logger.error(f"Failed to download file {filename}: {e}")
            return None
    
    def delete_file(self, filename: str, bucket_type: str = 'uploads') -> bool:
        """
        Delete file from Cloud Storage
        
        Args:
            filename: Name of the file to delete
            bucket_type: Type of bucket ('uploads', 'exports', 'storage')
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot delete file")
            return False
        
        try:
            bucket_name = self._get_bucket_name(bucket_type)
            if not bucket_name:
                logger.error(f"Invalid bucket type: {bucket_type}")
                return False
            
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(filename)
            
            if blob.exists():
                blob.delete()
                logger.info(f"File deleted successfully: {filename}")
                return True
            else:
                logger.warning(f"File not found for deletion: {filename}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete file {filename}: {e}")
            return False
    
    def list_files(self, bucket_type: str = 'uploads', prefix: str = None) -> List[Dict[str, Any]]:
        """
        List files in Cloud Storage bucket
        
        Args:
            bucket_type: Type of bucket ('uploads', 'exports', 'storage')
            prefix: Optional prefix to filter files
        
        Returns:
            List of file information dictionaries
        """
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot list files")
            return []
        
        try:
            bucket_name = self._get_bucket_name(bucket_type)
            if not bucket_name:
                logger.error(f"Invalid bucket type: {bucket_type}")
                return []
            
            bucket = self.client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix)
            
            files = []
            for blob in blobs:
                files.append({
                    'name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created': blob.time_created.isoformat() if blob.time_created else None,
                    'updated': blob.updated.isoformat() if blob.updated else None,
                    'public_url': blob.public_url,
                    'md5_hash': blob.md5_hash
                })
            
            logger.info(f"Listed {len(files)} files from {bucket_type} bucket")
            return files
            
        except Exception as e:
            logger.error(f"Failed to list files from {bucket_type} bucket: {e}")
            return []
    
    def generate_signed_url(self, filename: str, bucket_type: str = 'uploads', expiration_hours: int = 1) -> Optional[str]:
        """
        Generate signed URL for temporary access to file
        
        Args:
            filename: Name of the file
            bucket_type: Type of bucket ('uploads', 'exports', 'storage')
            expiration_hours: Hours until URL expires
        
        Returns:
            Signed URL or None if failed
        """
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot generate signed URL")
            return None
        
        try:
            bucket_name = self._get_bucket_name(bucket_type)
            if not bucket_name:
                logger.error(f"Invalid bucket type: {bucket_type}")
                return None
            
            bucket = self.client.bucket(bucket_name)
            blob = bucket.blob(filename)
            
            if not blob.exists():
                logger.error(f"File not found: {filename}")
                return None
            
            # Generate signed URL
            expiration = datetime.utcnow() + timedelta(hours=expiration_hours)
            signed_url = blob.generate_signed_url(expiration=expiration, method='GET')
            
            logger.info(f"Generated signed URL for {filename}")
            return signed_url
            
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {filename}: {e}")
            return None
    
    def _get_bucket_name(self, bucket_type: str) -> Optional[str]:
        """Get bucket name based on type"""
        bucket_map = {
            'uploads': self.uploads_bucket_name,
            'exports': self.exports_bucket_name,
            'storage': self.storage_bucket_name
        }
        return bucket_map.get(bucket_type)
    
    def create_buckets_if_not_exist(self):
        """Create buckets if they don't exist"""
        if not self.is_enabled():
            logger.warning("Cloud Storage not enabled, cannot create buckets")
            return
        
        buckets_to_create = [
            (self.uploads_bucket_name, 'uploads'),
            (self.exports_bucket_name, 'exports'),
            (self.storage_bucket_name, 'storage')
        ]
        
        for bucket_name, bucket_type in buckets_to_create:
            if bucket_name:
                try:
                    bucket = self.client.bucket(bucket_name)
                    if not bucket.exists():
                        bucket = self.client.create_bucket(bucket_name)
                        logger.info(f"Created {bucket_type} bucket: {bucket_name}")
                    else:
                        logger.info(f"{bucket_type.capitalize()} bucket already exists: {bucket_name}")
                except Exception as e:
                    logger.error(f"Failed to create {bucket_type} bucket {bucket_name}: {e}")

# Global Cloud Storage manager instance
cloud_storage = CloudStorageManager()

# Utility functions for backward compatibility
def upload_to_cloud_storage(file_content: bytes, filename: str, content_type: str = None) -> Optional[str]:
    """Upload file to uploads bucket"""
    return cloud_storage.upload_file(file_content, filename, content_type, 'uploads')

def download_from_cloud_storage(filename: str) -> Optional[bytes]:
    """Download file from uploads bucket"""
    return cloud_storage.download_file(filename, 'uploads')

def delete_from_cloud_storage(filename: str) -> bool:
    """Delete file from uploads bucket"""
    return cloud_storage.delete_file(filename, 'uploads')
