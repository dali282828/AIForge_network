from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database (Neon PostgreSQL)
    DATABASE_URL: str = "postgresql://aiforge:aiforge@localhost:5432/aiforge"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - stored as string, parsed in main.py
    CORS_ORIGINS: str = '["http://localhost:5173", "http://localhost:3000"]'
    
    # IPFS
    IPFS_HOST: str = "localhost"
    IPFS_PORT: int = 5001
    IPFS_GATEWAY: str = "http://localhost:8080"
    IPFS_PROJECT_ID: str = ""  # For Infura
    IPFS_PROJECT_SECRET: str = ""  # For Infura
    
    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_SECURE: bool = False
    
    # Platform Wallets (Your wallets for receiving fees)
    PLATFORM_WALLET_ETH: str = "0x0000000000000000000000000000000000000000"  # Change this
    PLATFORM_WALLET_TRON: str = "T0000000000000000000000000000000"  # Change this
    
    # Platform Fees (as decimals, e.g., 0.30 = 30%)
    PLATFORM_FEE_SUBSCRIPTION: float = 0.30  # 30%
    PLATFORM_FEE_JOB: float = 0.05  # 5%
    PLATFORM_FEE_MODEL: float = 0.05  # 5%
    PLATFORM_FEE_API: float = 0.10  # 10%
    
    # Model Publishing & Listing Fees
    MODEL_PUBLISHING_FEE: float = 5.00  # $5.00 one-time
    MODEL_LISTING_FEE: float = 2.00  # $2.00/month
    MODEL_LISTING_GRACE_PERIOD_DAYS: int = 7  # 7 days grace period before delisting
    
    # Admin Wallets (Whitelist - comma-separated)
    ADMIN_WALLETS: str = ""  # e.g., "0xYourEthAddress,TYourTronAddress"
    
    # Blockchain RPC URLs
    ETH_RPC_URL: str = "https://mainnet.infura.io/v3/YOUR_KEY"  # Or use public RPC
    TRON_RPC_URL: str = "https://api.trongrid.io"
    
    # Payment confirmation settings
    ETH_REQUIRED_CONFIRMATIONS: int = 3
    TRON_REQUIRED_CONFIRMATIONS: int = 19  # Tron uses 19 confirmations
    
    # USDT Contract Addresses
    USDT_ETH_CONTRACT: str = "0xdAC17F958D2ee523a2206206994597C13D831ec7"  # Mainnet USDT
    USDT_TRON_CONTRACT: str = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"  # Tron USDT
    
    # NFT Configuration
    NFT_CONTRACT_TRON: str = ""  # TRC-721 NFT contract address (to be deployed)
    NFT_MINT_GAS_FEE: float = 0.10  # $0.10 gas fee for minting (user pays)
    NFT_REWARD_SUBSCRIPTION_PERCENT: float = 0.30  # 30% of subscription revenue to NFT holders
    NFT_REWARD_API_PERCENT: float = 0.10  # 10% of API revenue to NFT holders
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

