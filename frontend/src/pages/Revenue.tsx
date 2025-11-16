import { useState, useEffect } from 'react'
import api from '../api/client'
import ComingSoon from '../components/ComingSoon'

interface Earnings {
  total_earnings: string
  subscription_earnings: string
  api_earnings: string
  by_model: Array<{
    model_id: number
    model_name: string
    earnings: string
  }>
}

export default function Revenue() {
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    loadEarnings()
  }, [year, month])

  const loadEarnings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/revenue/my-earnings', {
        params: { year, month }
      })
      setEarnings(response.data)
    } catch (error) {
      console.error('Failed to load earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' })
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Revenue Dashboard
          </h1>
          <p className="text-gray-600 text-lg">Track your earnings and revenue streams</p>
        </div>

        {/* Period Selector */}
        <div className="card p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                min="2024"
                max="2100"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={loadEarnings}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Earnings Summary */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : earnings ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card-hover p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💰</div>
                  <div className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">
                    Total
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(earnings.total_earnings || '0').toFixed(2)}
                </p>
              </div>
              
              <div className="card-hover p-6 bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">📅</div>
                  <div className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">
                    Subscriptions
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">Subscription Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(earnings.subscription_earnings || '0').toFixed(2)}
                </p>
              </div>
              
              <div className="card-hover p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🔌</div>
                  <div className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                    API
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">API Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(earnings.api_earnings || '0').toFixed(2)}
                </p>
              </div>
            </div>

            {/* Earnings by Model */}
            {earnings.by_model && earnings.by_model.length > 0 && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings by Model</h2>
                <div className="space-y-3">
                  {earnings.by_model.map((model) => (
                    <div
                      key={model.model_id}
                      className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">🤖</div>
                        <div>
                          <p className="font-semibold text-gray-900">{model.model_name}</p>
                          <p className="text-sm text-gray-500">Model ID: {model.model_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${parseFloat(model.earnings || '0').toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform Coin Earnings - Coming Soon */}
            <div className="card p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Platform Coin Rewards</h2>
                <ComingSoon feature="Platform Coin" size="sm" />
              </div>
              <ComingSoon
                feature="AIForge Platform Coin"
                description="In the future, platform-native coins will replace USDT for all payments and rewards. Coins will be used for payments, rewards, staking, and governance. Currently using USDT (v1.0)."
                variant="card"
              />
            </div>
          </>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No earnings data</h3>
            <p className="text-gray-600">
              No earnings data available for {months[month - 1]?.label} {year}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
