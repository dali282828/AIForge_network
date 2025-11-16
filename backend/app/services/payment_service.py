"""
Payment Service for USDT transactions on Ethereum and Tron networks
Handles payment verification, confirmation tracking, and fee calculation
"""
from typing import Optional, Dict, Any, Tuple
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.payment import Payment, PaymentStatus, PaymentType
from app.models.wallet import WalletNetwork
from app.core.config import settings
import requests
import time

class PaymentService:
    """Service for processing and verifying crypto payments"""
    
    @staticmethod
    def calculate_platform_fee(amount: Decimal, payment_type: PaymentType) -> Tuple[Decimal, Decimal]:
        """Calculate platform fee and net amount"""
        fee_percent = Decimal(0)
        
        if payment_type == PaymentType.SUBSCRIPTION:
            fee_percent = Decimal(str(settings.PLATFORM_FEE_SUBSCRIPTION))
        elif payment_type == PaymentType.JOB:
            fee_percent = Decimal(str(settings.PLATFORM_FEE_JOB))
        elif payment_type == PaymentType.MODEL_PURCHASE:
            fee_percent = Decimal(str(settings.PLATFORM_FEE_MODEL))
        elif payment_type == PaymentType.API_SUBSCRIPTION or payment_type == PaymentType.API_USAGE:
            fee_percent = Decimal(str(settings.PLATFORM_FEE_API))
        
        platform_fee = amount * fee_percent
        net_amount = amount - platform_fee
        
        return platform_fee, net_amount
    
    @staticmethod
    def get_platform_wallet(network: WalletNetwork) -> str:
        """Get platform wallet address for receiving payments"""
        if network == WalletNetwork.ETHEREUM:
            return settings.PLATFORM_WALLET_ETH
        elif network == WalletNetwork.TRON:
            return settings.PLATFORM_WALLET_TRON
        return ""
    
    @staticmethod
    def verify_ethereum_transaction(tx_hash: str) -> Optional[Dict[str, Any]]:
        """Verify Ethereum transaction using RPC"""
        try:
            # Use public RPC or configured RPC
            rpc_url = settings.ETH_RPC_URL
            
            # Get transaction receipt
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_getTransactionReceipt",
                "params": [tx_hash],
                "id": 1
            }
            
            response = requests.post(rpc_url, json=payload, timeout=10)
            if response.status_code != 200:
                return None
            
            data = response.json()
            if "result" not in data or data["result"] is None:
                return None
            
            receipt = data["result"]
            
            # Get transaction details
            tx_payload = {
                "jsonrpc": "2.0",
                "method": "eth_getTransactionByHash",
                "params": [tx_hash],
                "id": 1
            }
            
            tx_response = requests.post(rpc_url, json=tx_payload, timeout=10)
            if tx_response.status_code != 200:
                return None
            
            tx_data = tx_response.json()
            if "result" not in tx_data:
                return None
            
            transaction = tx_data["result"]
            
            # Get current block number for confirmations
            block_payload = {
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 1
            }
            
            block_response = requests.post(rpc_url, json=block_payload, timeout=10)
            current_block = 0
            if block_response.status_code == 200:
                block_data = block_response.json()
                if "result" in block_data:
                    current_block = int(block_data["result"], 16)
            
            block_number = int(receipt["blockNumber"], 16) if receipt.get("blockNumber") else 0
            confirmations = max(0, current_block - block_number) if current_block > 0 else 0
            
            # Check if transaction was successful
            status = receipt.get("status")
            is_success = status == "0x1" if status else False
            
            return {
                "success": is_success,
                "block_number": block_number,
                "block_hash": receipt.get("blockHash"),
                "confirmations": confirmations,
                "from_address": transaction.get("from", "").lower(),
                "to_address": transaction.get("to", "").lower(),
                "value": int(transaction.get("value", "0x0"), 16) / 1e18,  # Convert from wei
                "gas_used": int(receipt.get("gasUsed", "0x0"), 16),
            }
        except Exception as e:
            print(f"Error verifying Ethereum transaction: {e}")
            return None
    
    @staticmethod
    def verify_tron_transaction(tx_hash: str) -> Optional[Dict[str, Any]]:
        """Verify Tron transaction using TronGrid API"""
        try:
            api_url = f"{settings.TRON_RPC_URL}/wallet/gettransactionbyid"
            payload = {"value": tx_hash}
            
            response = requests.post(api_url, json=payload, timeout=10)
            if response.status_code != 200:
                return None
            
            data = response.json()
            if not data or "ret" not in data:
                return None
            
            # Check if transaction was successful
            ret = data.get("ret", [])
            is_success = ret[0].get("contractRet") == "SUCCESS" if ret else False
            
            if not is_success:
                return {"success": False}
            
            # Get contract details (for USDT transfers)
            contract = data.get("raw_data", {}).get("contract", [])
            if not contract:
                return None
            
            contract_data = contract[0].get("parameter", {}).get("value", {})
            
            # Get current block for confirmations
            block_url = f"{settings.TRON_RPC_URL}/wallet/getnowblock"
            block_response = requests.get(block_url, timeout=10)
            current_block = 0
            if block_response.status_code == 200:
                block_data = block_response.json()
                current_block = block_data.get("block_header", {}).get("raw_data", {}).get("number", 0)
            
            block_number = data.get("blockNumber", 0)
            confirmations = max(0, current_block - block_number) if current_block > 0 else 0
            
            # Extract addresses and amount (for TRC20 transfers)
            from_address = contract_data.get("owner_address", "")
            to_address = contract_data.get("to_address", "")
            amount = contract_data.get("amount", 0) / 1e6  # TRC20 USDT has 6 decimals
            
            return {
                "success": True,
                "block_number": block_number,
                "block_hash": data.get("blockHash", ""),
                "confirmations": confirmations,
                "from_address": from_address,
                "to_address": to_address,
                "value": amount,
            }
        except Exception as e:
            print(f"Error verifying Tron transaction: {e}")
            return None
    
    @staticmethod
    def verify_payment(
        db: Session,
        payment_id: int,
        tx_hash: str,
        network: WalletNetwork
    ) -> bool:
        """Verify and update payment status based on blockchain transaction"""
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            return False
        
        # Verify transaction
        if network == WalletNetwork.ETHEREUM:
            tx_data = PaymentService.verify_ethereum_transaction(tx_hash)
        elif network == WalletNetwork.TRON:
            tx_data = PaymentService.verify_tron_transaction(tx_hash)
        else:
            return False
        
        if not tx_data:
            return False
        
        # Update payment with transaction data
        payment.tx_hash = tx_hash
        payment.block_number = tx_data.get("block_number")
        payment.block_hash = tx_data.get("block_hash")
        payment.confirmations = tx_data.get("confirmations", 0)
        
        required_confirmations = settings.ETH_REQUIRED_CONFIRMATIONS if network == WalletNetwork.ETHEREUM else settings.TRON_REQUIRED_CONFIRMATIONS
        
        if not tx_data.get("success"):
            payment.status = PaymentStatus.FAILED
        elif payment.confirmations >= required_confirmations:
            payment.status = PaymentStatus.CONFIRMED
            from datetime import datetime
            payment.confirmed_at = datetime.utcnow()
        else:
            payment.status = PaymentStatus.CONFIRMING
        
        db.commit()
        return True
    
    @staticmethod
    def create_payment(
        db: Session,
        payment_type: PaymentType,
        amount: Decimal,
        from_wallet_id: int,
        from_address: str,
        to_address: str,
        network: WalletNetwork,
        currency: str = "USDT",
        subscription_id: Optional[int] = None,
        job_id: Optional[int] = None,
        model_id: Optional[int] = None,
        api_subscription_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Payment:
        """Create a new payment record"""
        # Calculate fees
        platform_fee_amount, net_amount = PaymentService.calculate_platform_fee(amount, payment_type)
        platform_fee_percent = Decimal(str(settings.PLATFORM_FEE_SUBSCRIPTION)) if payment_type == PaymentType.SUBSCRIPTION else Decimal(str(settings.PLATFORM_FEE_JOB))
        
        payment = Payment(
            payment_type=payment_type,
            status=PaymentStatus.PENDING,
            amount=amount,
            currency=currency,
            network=network.value,
            platform_fee_percent=platform_fee_percent,
            platform_fee_amount=platform_fee_amount,
            net_amount=net_amount,
            from_wallet_id=from_wallet_id,
            from_address=from_address.lower() if network == WalletNetwork.ETHEREUM else from_address,
            to_address=to_address.lower() if network == WalletNetwork.ETHEREUM else to_address,
            subscription_id=subscription_id,
            job_id=job_id,
            model_id=model_id,
            api_subscription_id=api_subscription_id,
            metadata=metadata,
            required_confirmations=settings.ETH_REQUIRED_CONFIRMATIONS if network == WalletNetwork.ETHEREUM else settings.TRON_REQUIRED_CONFIRMATIONS
        )
        
        db.add(payment)
        db.commit()
        db.refresh(payment)
        
        return payment

