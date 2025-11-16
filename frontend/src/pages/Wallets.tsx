import { useState, useEffect } from 'react'
import api from '../api/client'
import ComingSoon from '../components/ComingSoon'

interface Wallet {
  id: number
  wallet_address: string
  network: string
  wallet_type: string
  is_verified: boolean
  verified_at?: string
}

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/wallets/my-wallets')
      setWallets(response.data)
    } catch (error) {
      console.error('Failed to load wallets:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectTronLink = async () => {
    // Check if TronLink is installed
    if (typeof window === 'undefined' || !(window as any).tronWeb) {
      alert('Please install TronLink extension first!')
      return
    }

    try {
      setConnecting(true)
      const tronWeb = (window as any).tronWeb
      
      // Request account access
      const accounts = await tronWeb.request({
        method: 'tron_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]

      // Get auth message
      const messageResponse = await api.get('/auth/wallet/auth-message', {
        params: {
          wallet_address: address,
          network: 'tron'
        }
      })

      const message = messageResponse.data.message

      // Sign message
      const signedMessage = await tronWeb.trx.signMessage(message)
      const signature = signedMessage

      // Login/Connect wallet
      const loginResponse = await api.post('/auth/wallet/login', {
        wallet_address: address,
        network: 'tron',
        wallet_type: 'tronlink',
        signature: signature,
        message: message
      })

      // Update auth token if login was successful
      if (loginResponse.data.access_token) {
        // Store token (update auth store)
        const { useAuthStore } = await import('../store/authStore')
        useAuthStore.getState().setToken(loginResponse.data.access_token)
        
        // Show admin status if applicable
        if (loginResponse.data.is_admin) {
          alert('Wallet connected successfully! Admin access granted.')
        } else {
          alert('Wallet connected successfully!')
        }
      }

      await loadWallets()
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      alert(error.response?.data?.detail || 'Failed to connect wallet. Make sure TronLink is installed and unlocked.')
    } finally {
      setConnecting(false)
    }
  }

  const verifyWallet = async (walletId: number) => {
    try {
      // Get verification message
      const messageResponse = await api.get(`/wallets/verification-message/${walletId}`)
      const message = messageResponse.data.message

      // Check TronLink
      if (typeof window === 'undefined' || !(window as any).tronWeb) {
        alert('Please install TronLink extension first!')
        return
      }

      const tronWeb = (window as any).tronWeb
      const signedMessage = await tronWeb.trx.signMessage(message)
      const signature = signedMessage

      // Verify wallet
      await api.post('/wallets/verify', {
        wallet_id: walletId,
        signature: signature,
        message: message
      })

      await loadWallets()
      alert('Wallet verified successfully!')
    } catch (error: any) {
      console.error('Failed to verify wallet:', error)
      alert(error.response?.data?.detail || 'Failed to verify wallet')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Wallets</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Wallet</h2>
        <p className="text-gray-600 mb-4">
          Connect your TronLink wallet to make payments and interact with the platform. Only Tron network is supported for users.
        </p>
        <button
          onClick={connectTronLink}
          disabled={connecting}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {connecting ? 'Connecting...' : 'Connect TronLink Wallet'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Make sure TronLink extension is installed and unlocked
        </p>
      </div>

      {/* Platform Coin Wallet - Coming Soon */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Platform Coin Wallet</h2>
          <ComingSoon feature="Platform Coin" size="sm" />
        </div>
        <ComingSoon
          feature="AIForge Platform Coin Wallet"
          description="In the future, platform-native coins will replace USDT. You'll use coin wallets for all payments, rewards, staking, and governance. Currently using USDT wallets (v1.0)."
          variant="card"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connected Wallets</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : wallets.length === 0 ? (
          <p className="text-gray-600">No wallets connected. Connect one above!</p>
        ) : (
          <div className="space-y-4">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{wallet.wallet_address}</p>
                    <p className="text-sm text-gray-600">
                      Network: {wallet.network} | Type: {wallet.wallet_type}
                    </p>
                    <p className="text-sm mt-2">
                      Status:{' '}
                      <span className={`font-medium ${
                        wallet.is_verified ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {wallet.is_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </p>
                    {wallet.verified_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Verified: {new Date(wallet.verified_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {!wallet.is_verified && (
                    <button
                      onClick={() => verifyWallet(wallet.id)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

