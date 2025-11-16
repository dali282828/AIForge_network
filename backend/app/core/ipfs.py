import ipfshttpclient
import requests
from app.core.config import settings

class IPFSClient:
    def __init__(self):
        self.client = None
        self.use_infura = settings.IPFS_HOST == "ipfs.infura.io" and settings.IPFS_PROJECT_ID
        self._connect()
    
    def _connect(self):
        """Connect to IPFS node"""
        try:
            if self.use_infura:
                # Infura uses HTTP API with authentication
                # We'll use requests directly for Infura
                self.client = None  # Use requests for Infura
            else:
                # Standard IPFS node connection
                self.client = ipfshttpclient.connect(f'/ip4/{settings.IPFS_HOST}/tcp/{settings.IPFS_PORT}')
        except Exception as e:
            print(f"Failed to connect to IPFS: {e}")
            self.client = None
    
    def add(self, file_path: str) -> str:
        """Add file to IPFS and return CID"""
        if not self.client:
            self._connect()
        if not self.client:
            raise Exception("IPFS client not available")
        
        result = self.client.add(file_path)
        return result['Hash']
    
    def add_bytes(self, data: bytes) -> str:
        """Add bytes data to IPFS and return CID"""
        if self.use_infura:
            # Use Infura API
            import base64
            from io import BytesIO
            auth = base64.b64encode(f"{settings.IPFS_PROJECT_ID}:{settings.IPFS_PROJECT_SECRET}".encode()).decode()
            url = f"https://{settings.IPFS_HOST}:{settings.IPFS_PORT}/api/v0/add"
            files = {'file': BytesIO(data)}
            headers = {
                'Authorization': f'Basic {auth}'
            }
            response = requests.post(url, files=files, headers=headers, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result.get('Hash', '')
        
        if not self.client:
            self._connect()
        if not self.client:
            raise Exception("IPFS client not available")
        
        result = self.client.add_bytes(data)
        # ipfshttpclient.add_bytes returns a dict with 'Hash' key
        if isinstance(result, dict):
            return result.get('Hash', '')
        return result
    
    def get(self, cid: str, output_path: str = None):
        """Get file from IPFS by CID"""
        if not self.client:
            self._connect()
        if not self.client:
            raise Exception("IPFS client not available")
        
        return self.client.get(cid, output_path)
    
    def pin(self, cid: str):
        """Pin content to IPFS"""
        if self.use_infura:
            # Use Infura API
            import base64
            auth = base64.b64encode(f"{settings.IPFS_PROJECT_ID}:{settings.IPFS_PROJECT_SECRET}".encode()).decode()
            url = f"https://{settings.IPFS_HOST}:{settings.IPFS_PORT}/api/v0/pin/add"
            params = {'arg': cid}
            headers = {
                'Authorization': f'Basic {auth}'
            }
            response = requests.post(url, params=params, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        
        if not self.client:
            self._connect()
        if not self.client:
            raise Exception("IPFS client not available")
        
        return self.client.pin.add(cid)
    
    def unpin(self, cid: str):
        """Unpin content from IPFS"""
        if not self.client:
            self._connect()
        if not self.client:
            raise Exception("IPFS client not available")
        
        return self.client.pin.rm(cid)
    
    def get_gateway_url(self, cid: str) -> str:
        """Get gateway URL for a CID"""
        return f"{settings.IPFS_GATEWAY}/ipfs/{cid}"

# Global IPFS client instance
ipfs_client = IPFSClient()

