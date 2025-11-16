from minio import Minio
from minio.error import S3Error
from app.core.config import settings
from app.core.ipfs import ipfs_client
from typing import Optional
import io

class StorageService:
    def __init__(self):
        self.minio_client = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Lazy initialization of MinIO client"""
        if self._initialized:
            return
        
        try:
            self.minio_client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
            self._ensure_buckets()
            self._initialized = True
        except Exception as e:
            print(f"Warning: Failed to initialize MinIO client: {e}. Storage features will be limited.")
            self.minio_client = None
            self._initialized = True  # Mark as initialized to prevent retries
    
    def _ensure_buckets(self):
        """Ensure required buckets exist"""
        if not self.minio_client:
            return
        
        buckets = ['models', 'datasets', 'checkpoints', 'temp', 'chat-attachments']
        for bucket in buckets:
            try:
                if not self.minio_client.bucket_exists(bucket):
                    self.minio_client.make_bucket(bucket)
            except S3Error as e:
                print(f"Error creating bucket {bucket}: {e}")
    
    def upload_to_minio(self, bucket: str, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        """Upload file to MinIO and return object path"""
        self._ensure_initialized()
        if not self.minio_client:
            raise Exception("MinIO client not available. Check MINIO configuration.")
        
        try:
            data_stream = io.BytesIO(data)
            self.minio_client.put_object(
                bucket,
                object_name,
                data_stream,
                length=len(data),
                content_type=content_type
            )
            return f"{bucket}/{object_name}"
        except S3Error as e:
            raise Exception(f"Failed to upload to MinIO: {e}")
    
    def upload_to_ipfs(self, data: bytes) -> str:
        """Upload data to IPFS and return CID"""
        try:
            cid = ipfs_client.add_bytes(data)
            ipfs_client.pin(cid)  # Pin to ensure persistence
            return cid
        except Exception as e:
            raise Exception(f"Failed to upload to IPFS: {e}")
    
    def upload_hybrid(self, data: bytes, use_ipfs: bool = True) -> dict:
        """
        Upload to both MinIO (ephemeral) and IPFS (permanent)
        Returns dict with both paths
        """
        result = {}
        
        # Always upload to MinIO for fast access
        import uuid
        object_name = f"{uuid.uuid4()}"
        result['minio_path'] = self.upload_to_minio('temp', object_name, data)
        
        # Upload to IPFS if requested
        if use_ipfs:
            result['ipfs_cid'] = self.upload_to_ipfs(data)
            result['ipfs_gateway_url'] = ipfs_client.get_gateway_url(result['ipfs_cid'])
        
        return result
    
    def get_from_minio(self, bucket: str, object_name: str) -> bytes:
        """Get file from MinIO"""
        self._ensure_initialized()
        if not self.minio_client:
            raise Exception("MinIO client not available. Check MINIO configuration.")
        
        try:
            response = self.minio_client.get_object(bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            raise Exception(f"Failed to get from MinIO: {e}")
    
    def get_from_ipfs(self, cid: str) -> bytes:
        """Get file from IPFS by CID"""
        try:
            # Get from IPFS gateway or direct node
            import requests
            gateway_url = ipfs_client.get_gateway_url(cid)
            response = requests.get(gateway_url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            raise Exception(f"Failed to get from IPFS: {e}")

# Global storage service instance
storage_service = StorageService()

