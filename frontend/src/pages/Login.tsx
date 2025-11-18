import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const { setToken } = useAuthStore()
  const navigate = useNavigate()

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(window.location.search)
  const redirect = searchParams.get('redirect') || '/'

  const handleWalletLogin = async () => {
    // Check if TronLink is installed - EXACTLY like Wallets.tsx
    if (typeof window === 'undefined' || !(window as any).tronWeb) {
      alert('Please install TronLink extension first!')
      return
    }

    try {
      setWalletConnecting(true)
      setError('')
      
      // Use EXACT same approach as Wallets.tsx - simple and direct
      const tronWeb = (window as any).tronWeb
      
      // Request account access - use same approach as Wallets.tsx
      const accountsResponse = await tronWeb.request({
        method: 'tron_requestAccounts'
      })

      // Extract address - handle different response formats
      let address: string | undefined
      
      if (Array.isArray(accountsResponse)) {
        // Direct array response
        address = accountsResponse[0]
      } else if (accountsResponse && typeof accountsResponse === 'object') {
        // Response object - try to get address from tronWeb.defaultAddress
        if (tronWeb.defaultAddress && tronWeb.defaultAddress.base58) {
          address = tronWeb.defaultAddress.base58
        } else if (tronWeb.address) {
          address = tronWeb.address
        } else if (accountsResponse.data && Array.isArray(accountsResponse.data)) {
          address = accountsResponse.data[0]
        }
      }
      
      // Validate and normalize address
      if (!address || typeof address !== 'string' || address.trim() === '') {
        throw new Error('Invalid wallet address. Please make sure TronLink is unlocked and has an account selected.')
      }
      
      // Normalize address (trim whitespace)
      address = address.trim()

      // Get auth message
      const messageResponse = await api.get('/auth/wallet/auth-message', {
        params: {
          wallet_address: address,
          network: 'tron'
        }
      })

      // Ensure message is a string
      let message = messageResponse.data.message
      if (!message || typeof message !== 'string') {
        throw new Error('Invalid message received from server. Please try again.')
      }
      
      // Trim and validate message
      message = String(message).trim()
      if (message.length === 0) {
        throw new Error('Empty message received. Please try again.')
      }

      // Sign message - TronLink signMessage requires hex-encoded message
      let signature: string
      
      // Convert message to hex format (TronLink requirement)
      // Ensure it's a proper string
      const messageBytes = Array.from(new TextEncoder().encode(String(message)))
      const messageHex = String(messageBytes.map(b => b.toString(16).padStart(2, '0')).join(''))
      
      // Validate hex string
      if (!messageHex || typeof messageHex !== 'string' || messageHex.length === 0) {
        throw new Error('Failed to convert message to hex format')
      }
      
      try {
        // Method 1: Use tronWeb.trx.sign with hex message (most reliable)
        if (tronWeb.trx && typeof tronWeb.trx.sign === 'function') {
          signature = await tronWeb.trx.sign(messageHex)
        } else if (tronWeb.trx && typeof tronWeb.trx.signMessage === 'function') {
          // Fallback to signMessage
          signature = await tronWeb.trx.signMessage(messageHex)
        } else {
          throw new Error('TronLink sign methods not available')
        }
      } catch (signError: any) {
        console.error('Signing failed:', signError)
        throw new Error(`Failed to sign message: ${signError.message}. Please make sure TronLink is unlocked and try again.`)
      }

      // Login/Connect wallet - use normalized address consistently
      const loginResponse = await api.post('/auth/wallet/login', {
        wallet_address: address,
        network: 'tron',
        wallet_type: 'tronlink',
        signature: signature,
        message: message
      })

      // Update auth store
      if (loginResponse.data.access_token) {
        await setToken(loginResponse.data.access_token)
        
        // Set admin status if applicable
        if (loginResponse.data.is_admin) {
          const { useAuthStore } = await import('../store/authStore')
          useAuthStore.getState().setAdminStatus(true)
          alert('✅ Wallet connected successfully! Admin access granted.')
        } else {
          const { useAuthStore } = await import('../store/authStore')
          useAuthStore.getState().setAdminStatus(false)
          alert('✅ Wallet connected successfully!')
        }
        
        navigate(redirect)
      }
    } catch (err: any) {
      console.error('Wallet login error:', err)
      let errorMessage = 'Failed to connect wallet. Make sure TronLink is installed and unlocked.'
      
      if (err.response?.data) {
        // Handle FastAPI validation errors
        if (err.response.data.detail) {
          if (Array.isArray(err.response.data.detail)) {
            // Multiple validation errors
            errorMessage = err.response.data.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
          } else if (typeof err.response.data.detail === 'string') {
            errorMessage = err.response.data.detail
          } else {
            errorMessage = JSON.stringify(err.response.data.detail)
          }
        } else {
          errorMessage = JSON.stringify(err.response.data)
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setWalletConnecting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const login = useAuthStore.getState().login
      await login(email, password)
      navigate(redirect)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              AIForge Network
            </h1>
            <p className="text-gray-600">Sign in with your wallet</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          {/* Wallet Login - Primary Method */}
          <div className="space-y-4 mb-6">
            <button
              onClick={handleWalletLogin}
              disabled={walletConnecting}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {walletConnecting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Connect with TronLink Wallet
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-500">
              Secure login using your TronLink wallet. Admin wallets automatically get admin access.
            </p>

            {!showEmailLogin && (
              <div className="text-center">
                <button
                  onClick={() => setShowEmailLogin(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Or sign in with email
                </button>
              </div>
            )}
          </div>

          {/* Email/Password Login - Secondary Method */}
          {showEmailLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with email</span>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      'Sign in with Email'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowEmailLogin(false)}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    ← Back to wallet login
                  </button>
                </div>
              </form>
            </>
          )}

          {!showEmailLogin && (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Don't have TronLink?{' '}
                <a 
                  href="https://www.tronlink.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Install it here
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
