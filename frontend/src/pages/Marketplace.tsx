import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import ComingSoon from '../components/ComingSoon'

interface APIService {
  id: number
  name: string
  description?: string
  model_id: number
  pricing_type: string
  subscription_price?: string
  pay_per_request_price?: string
  is_active: boolean
  total_requests: number
  total_revenue: string
  user_id?: number
  created_at?: string
  owner?: {
    username: string
  }
}

interface APISubscription {
  id: number
  service_id: number
  service: APIService
  api_key: string
  is_active: boolean
  created_at: string
  subscription_type?: string
  credits_remaining?: number
  requests_used_this_month?: number
}

export default function Marketplace() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [services, setServices] = useState<APIService[]>([])
  const [subscriptions, setSubscriptions] = useState<APISubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPricing, setSelectedPricing] = useState<'all' | 'subscription' | 'pay-per-request'>('all')
  const [showApiKey, setShowApiKey] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>('popular')

  useEffect(() => {
    loadServices()
    if (isAuthenticated) {
      loadSubscriptions()
    }
  }, [isAuthenticated])

  const loadServices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/marketplace/marketplace')
      setServices(response.data || [])
    } catch (error) {
      console.error('Failed to load marketplace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const response = await api.get('/marketplace/my-subscriptions')
      setSubscriptions(response.data || [])
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    }
  }

  const subscribeToService = async (serviceId: number) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/marketplace')
      return
    }

    try {
      // Get user's wallet first
      const walletsResponse = await api.get('/wallets/my-wallets')
      const wallets = walletsResponse.data
      
      if (!wallets || wallets.length === 0) {
        alert('Please connect a wallet first!')
        navigate('/wallets')
        return
      }

      const walletId = wallets[0].id
      const pricingType = services.find(s => s.id === serviceId)?.pricing_type || 'subscription'
      
      await api.post(`/marketplace/${serviceId}/subscribe`, {
        wallet_id: walletId,
        subscription_type: pricingType
      })
      await loadSubscriptions()
      alert('Subscribed successfully!')
    } catch (error: any) {
      console.error('Failed to subscribe:', error)
      alert(error.response?.data?.detail || 'Failed to subscribe')
    }
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    alert('API Key copied to clipboard!')
  }

  const filteredAndSortedServices = services
    .filter(service => {
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPricing = selectedPricing === 'all' ||
        (selectedPricing === 'subscription' && service.subscription_price) ||
        (selectedPricing === 'pay-per-request' && service.pay_per_request_price)
      
      return matchesSearch && matchesPricing
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.total_requests || 0) - (a.total_requests || 0)
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'price-low':
          const priceA = parseFloat(a.subscription_price || a.pay_per_request_price || '999999')
          const priceB = parseFloat(b.subscription_price || b.pay_per_request_price || '999999')
          return priceA - priceB
        case 'price-high':
          const priceA2 = parseFloat(a.subscription_price || a.pay_per_request_price || '0')
          const priceB2 = parseFloat(b.subscription_price || b.pay_per_request_price || '0')
          return priceB2 - priceA2
        default:
          return 0
      }
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            AI Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Discover and integrate powerful AI models and services. Browse, subscribe, and start building.
          </p>
          <div className="flex justify-center">
            <ComingSoon
              feature="Pay with Platform Coins"
              description="In the future, all payments will use AIForge platform coins instead of USDT. Currently using USDT for payments (v1.0)."
              size="md"
              variant="badge"
            />
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search services by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <svg
                className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPricing('all')}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedPricing === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedPricing('subscription')}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedPricing === 'subscription'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Subscription
                </button>
                <button
                  onClick={() => setSelectedPricing('pay-per-request')}
                  className={`px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedPricing === 'pay-per-request'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Pay Per Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* My Subscriptions - Only for logged in users */}
        {isAuthenticated && subscriptions.length > 0 && (
          <div className="mb-8">
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Subscriptions</h2>
                  <p className="text-gray-600 mt-1">Manage your active API subscriptions</p>
                </div>
                <span className="badge-success">
                  {subscriptions.filter(s => s.is_active).length} Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-1">{sub.service.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{sub.service.description || 'No description'}</p>
                      </div>
                      <span className={`badge ${sub.is_active ? 'badge-success' : 'bg-gray-100 text-gray-600'}`}>
                        {sub.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-gray-900 capitalize">
                          {sub.subscription_type?.replace('_', ' ') || 'N/A'}
                        </span>
                      </div>
                      {sub.credits_remaining !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Credits:</span>
                          <span className="font-medium text-gray-900">
                            ${sub.credits_remaining.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {sub.requests_used_this_month !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Requests (month):</span>
                          <span className="font-medium text-gray-900">
                            {sub.requests_used_this_month}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">API Key</span>
                        <button
                          onClick={() => setShowApiKey(showApiKey === sub.id ? null : sub.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {showApiKey === sub.id ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {showApiKey === sub.id && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-xs font-mono text-gray-800 break-all">
                            {sub.api_key}
                          </code>
                          <button
                            onClick={() => copyApiKey(sub.api_key)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Available Services</h2>
              <p className="text-gray-600 mt-1">
                {filteredAndSortedServices.length} {filteredAndSortedServices.length === 1 ? 'service' : 'services'} available
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAndSortedServices.length === 0 ? (
            <div className="card p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No services found</h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search or filters' : 'No services available yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedServices.map((service) => {
                const isSubscribed = isAuthenticated && subscriptions.some(s => s.service_id === service.id && s.is_active)
                const subscription = isAuthenticated ? subscriptions.find(s => s.service_id === service.id) : null
                
                return (
                  <div
                    key={service.id}
                    className="card-hover p-6 group relative overflow-hidden"
                  >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative">
                      {/* Service Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
                            {service.description || 'No description available'}
                          </p>
                        </div>
                        {isSubscribed && (
                          <span className="badge-success ml-2 flex-shrink-0">Subscribed</span>
                        )}
                      </div>

                      {/* Pricing Card */}
                      <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Pricing</p>
                        <div className="space-y-1">
                          {service.subscription_price && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Monthly:</span>
                              <span className="font-bold text-lg text-gray-900">
                                ${parseFloat(service.subscription_price).toFixed(2)}
                                <span className="text-sm font-normal text-gray-600">/mo</span>
                              </span>
                            </div>
                          )}
                          {service.pay_per_request_price && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Per Request:</span>
                              <span className="font-bold text-lg text-gray-900">
                                ${parseFloat(service.pay_per_request_price).toFixed(4)}
                                <span className="text-sm font-normal text-gray-600">/req</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>{service.total_requests || 0} requests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>${parseFloat(service.total_revenue || '0').toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {!isAuthenticated ? (
                        <Link
                          to="/login?redirect=/marketplace"
                          className="w-full btn-primary block text-center"
                        >
                          Sign in to Subscribe
                        </Link>
                      ) : !isSubscribed ? (
                        <button
                          onClick={() => subscribeToService(service.id)}
                          className="w-full btn-primary"
                        >
                          Subscribe Now
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => setShowApiKey(showApiKey === service.id ? null : service.id)}
                            className="w-full btn-secondary"
                          >
                            {showApiKey === service.id ? 'Hide API Key' : 'View API Key'}
                          </button>
                          {showApiKey === service.id && subscription && (
                            <div className="flex items-center gap-2">
                              <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-xs font-mono text-gray-800 break-all">
                                {subscription.api_key}
                              </code>
                              <button
                                onClick={() => copyApiKey(subscription.api_key)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Call to Action for Non-Authenticated Users */}
        {!isAuthenticated && (
          <div className="mt-12 card p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
            <p className="text-blue-100 mb-6">Create an account to subscribe to services and start building</p>
            <div className="flex gap-4 justify-center">
              <Link to="/register" className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Sign Up Free
              </Link>
              <Link to="/login" className="px-6 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
