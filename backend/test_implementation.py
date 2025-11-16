"""
Test script to verify implementation
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test all imports"""
    print("Testing imports...")
    
    try:
        from app.models import (
            User, Group, Model, Node, Job,
            UserWallet, AdminWallet, WalletNetwork, WalletType,
            Payment, PaymentStatus, PaymentType,
            Subscription, SubscriptionPlan, SubscriptionStatus,
            APIService, APISubscription, APIRequest, PricingType,
            ModelPublishing, PublishingStatus, GroupRevenueSplit, RevenueDistribution,
            NFTShare, NFTReward, NFTRewardPool,
            InfrastructureInvestment, InfrastructureUsage, InfrastructurePayout,
            InfrastructureProvider, InfrastructureType, InfrastructureStatus
        )
        print("✓ All models imported successfully")
    except Exception as e:
        print(f"X Model import failed: {e}")
        return False
    
    try:
        from app.api import auth, wallets, payments, admin, nft, revenue
        print("✓ All API routers imported successfully")
    except Exception as e:
        print(f"X API import failed: {e}")
        return False
    
    try:
        from app.services import nft_service, wallet_service, payment_service
        print("✓ All services imported successfully")
    except Exception as e:
        print(f"X Service import failed: {e}")
        return False
    
    try:
        from app.main import app
        print("✓ Main app imported successfully")
    except Exception as e:
        print(f"X Main app import failed: {e}")
        return False
    
    return True

def test_network_restrictions():
    """Test network restrictions"""
    print("\nTesting network restrictions...")
    
    from app.models.wallet import WalletNetwork
    
    # Test enum values
    assert WalletNetwork.TRON == "tron"
    assert WalletNetwork.ETHEREUM == "ethereum"
    print("✓ WalletNetwork enum values correct")
    
    return True

def test_nft_models():
    """Test NFT models"""
    print("\nTesting NFT models...")
    
    from app.models.nft import NFTShare, NFTReward, NFTRewardPool
    
    # Check table names
    assert NFTShare.__tablename__ == "nft_shares"
    assert NFTReward.__tablename__ == "nft_rewards"
    assert NFTRewardPool.__tablename__ == "nft_reward_pools"
    print("✓ NFT model table names correct")
    
    return True

def test_infrastructure_models():
    """Test infrastructure models"""
    print("\nTesting infrastructure models...")
    
    from app.models.infrastructure import (
        InfrastructureInvestment, InfrastructureUsage, InfrastructurePayout,
        InfrastructureProvider, InfrastructureType, InfrastructureStatus
    )
    
    # Check table names
    assert InfrastructureInvestment.__tablename__ == "infrastructure_investments"
    assert InfrastructureUsage.__tablename__ == "infrastructure_usage"
    assert InfrastructurePayout.__tablename__ == "infrastructure_payouts"
    print("✓ Infrastructure model table names correct")
    
    # Check enum values
    assert InfrastructureProvider.AWS == "aws"
    assert InfrastructureType.GPU == "gpu"
    assert InfrastructureStatus.ACTIVE == "active"
    print("✓ Infrastructure enum values correct")
    
    return True

def test_config():
    """Test configuration"""
    print("\nTesting configuration...")
    
    from app.core.config import settings
    
    # Check NFT config exists
    assert hasattr(settings, 'NFT_CONTRACT_TRON')
    assert hasattr(settings, 'NFT_MINT_GAS_FEE')
    assert hasattr(settings, 'NFT_REWARD_SUBSCRIPTION_PERCENT')
    assert hasattr(settings, 'NFT_REWARD_API_PERCENT')
    print("✓ NFT configuration exists")
    
    # Check platform wallets
    assert hasattr(settings, 'PLATFORM_WALLET_TRON')
    assert hasattr(settings, 'PLATFORM_WALLET_ETH')
    print("✓ Platform wallet configuration exists")
    
    return True

def test_api_routes():
    """Test API routes are registered"""
    print("\nTesting API routes...")
    
    from app.main import app
    
    routes = [route.path for route in app.routes]
    
    # Check NFT routes
    nft_routes = [r for r in routes if '/nft' in r]
    assert len(nft_routes) > 0, "NFT routes not found"
    print(f"✓ NFT routes registered: {len(nft_routes)} routes")
    
    # Check other important routes
    assert any('/api/auth' in r for r in routes), "Auth routes not found"
    assert any('/api/wallets' in r for r in routes), "Wallet routes not found"
    assert any('/api/payments' in r for r in routes), "Payment routes not found"
    print("✓ Core API routes registered")
    
    return True

def main():
    """Run all tests"""
    print("=" * 60)
    print("AIForge Network - Implementation Test")
    print("=" * 60)
    
    tests = [
        test_imports,
        test_network_restrictions,
        test_nft_models,
        test_infrastructure_models,
        test_config,
        test_api_routes
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"X Test {test.__name__} failed with exception: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("✓ All tests passed!")
        return 0
    else:
        print("X Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())

