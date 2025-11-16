"""
Wallet Service for MetaMask and TronLink integration
Handles wallet connection, verification, and signature validation
"""
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.wallet import UserWallet, AdminWallet, WalletNetwork, WalletType
from app.core.config import settings
import hashlib
import hmac
import time
import secrets

class WalletService:
    """Service for managing user wallets and admin wallet verification"""
    
    @staticmethod
    def verify_wallet_signature(
        wallet_address: str,
        message: str,
        signature: str,
        network: WalletNetwork
    ) -> bool:
        """
        Verify wallet signature for authentication
        This is a simplified version - in production, use proper cryptographic verification
        """
        # TODO: Implement proper signature verification using web3.py for Ethereum
        # and tronpy for Tron. For now, we'll use a simple message verification.
        try:
            # Basic validation
            if not wallet_address or not signature or not message:
                return False
            
            # In production, verify the signature cryptographically:
            # - Ethereum: Use web3.py to recover address from signature
            # - Tron: Use tronpy to verify signature
            
            # For now, accept if signature is provided (will implement proper verification)
            return True
        except Exception as e:
            print(f"Error verifying wallet signature: {e}")
            return False
    
    @staticmethod
    def generate_verification_message(wallet_address: str, user_id: int) -> str:
        """Generate a message for wallet verification"""
        timestamp = int(time.time())
        message = f"AIForge Network\n\nVerify wallet ownership\n\nWallet: {wallet_address}\nUser ID: {user_id}\nTimestamp: {timestamp}"
        return message
    
    @staticmethod
    def generate_auth_message(wallet_address: str, nonce: Optional[str] = None) -> str:
        """Generate authentication message for wallet login"""
        timestamp = int(time.time())
        nonce = nonce or secrets.token_hex(16)
        message = f"AIForge Network\n\nSign in with wallet\n\nWallet: {wallet_address}\nTimestamp: {timestamp}\nNonce: {nonce}"
        return message
    
    @staticmethod
    def connect_wallet(
        db: Session,
        user_id: int,
        wallet_address: str,
        network: WalletNetwork,
        wallet_type: WalletType,
        signature: Optional[str] = None
    ) -> UserWallet:
        """Connect a wallet to a user account"""
        # Normalize wallet address
        wallet_address = wallet_address.lower() if network == WalletNetwork.ETHEREUM else wallet_address
        
        # Check if wallet already exists
        existing = db.query(UserWallet).filter(
            UserWallet.wallet_address == wallet_address,
            UserWallet.network == network
        ).first()
        
        if existing:
            # Update if different user
            if existing.user_id != user_id:
                existing.user_id = user_id
                existing.is_verified = False
                existing.verified_at = None
                existing.verification_signature = None
            return existing
        
        # Create new wallet connection
        wallet = UserWallet(
            user_id=user_id,
            wallet_address=wallet_address,
            network=network,
            wallet_type=wallet_type,
            is_verified=False,
            verification_signature=signature
        )
        
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        
        return wallet
    
    @staticmethod
    def verify_wallet(
        db: Session,
        wallet_id: int,
        signature: str,
        message: str
    ) -> bool:
        """Verify wallet ownership with signature"""
        wallet = db.query(UserWallet).filter(UserWallet.id == wallet_id).first()
        if not wallet:
            return False
        
        # Verify signature
        is_valid = WalletService.verify_wallet_signature(
            wallet.wallet_address,
            message,
            signature,
            wallet.network
        )
        
        if is_valid:
            from datetime import datetime
            wallet.is_verified = True
            wallet.verified_at = datetime.utcnow()
            wallet.verification_signature = signature
            db.commit()
            return True
        
        return False
    
    @staticmethod
    def is_admin_wallet(wallet_address: str, network: WalletNetwork) -> bool:
        """Check if a wallet address is in the admin whitelist"""
        # Normalize address first
        normalized_address = wallet_address.lower() if network == WalletNetwork.ETHEREUM else wallet_address
        
        # Check environment variable whitelist first (faster, no DB query)
        if settings.ADMIN_WALLETS:
            admin_list = [addr.strip() for addr in settings.ADMIN_WALLETS.split(",")]
            if normalized_address in admin_list:
                return True
        
        # Check database
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            admin_wallet = db.query(AdminWallet).filter(
                AdminWallet.wallet_address == normalized_address,
                AdminWallet.network == network,
                AdminWallet.is_active == True
            ).first()
            
            if admin_wallet:
                return True
        except Exception as e:
            print(f"Error checking admin wallet in database: {e}")
        finally:
            db.close()
        
        return False
    
    @staticmethod
    def add_admin_wallet(
        db: Session,
        wallet_address: str,
        network: WalletNetwork,
        added_by_user_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> AdminWallet:
        """Add a wallet to the admin whitelist"""
        normalized_address = wallet_address.lower() if network == WalletNetwork.ETHEREUM else wallet_address
        
        # Check if already exists
        existing = db.query(AdminWallet).filter(
            AdminWallet.wallet_address == normalized_address,
            AdminWallet.network == network
        ).first()
        
        if existing:
            existing.is_active = True
            existing.notes = notes
            db.commit()
            db.refresh(existing)
            return existing
        
        admin_wallet = AdminWallet(
            wallet_address=normalized_address,
            network=network,
            is_active=True,
            added_by=added_by_user_id,
            notes=notes
        )
        
        db.add(admin_wallet)
        db.commit()
        db.refresh(admin_wallet)
        
        return admin_wallet

