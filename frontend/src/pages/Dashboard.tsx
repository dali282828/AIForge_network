import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'
import ComingSoon from '../components/ComingSoon'

interface DashboardStats {
  groups: number
  models: number
  jobs: number
  subscriptions: number
  nodes: number
  revenue: string
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load user stats from various endpoints
      const [groupsRes, modelsRes, jobsRes, subscriptionsRes, nodesRes, revenueRes] = await Promise.allSettled([
        api.get('/groups/my-groups'),
        api.get('/models/my-models'),
        api.get('/jobs'),  // Fixed: endpoint is /jobs not /jobs/my-jobs
        api.get('/marketplace/my-subscriptions'),
        api.get('/nodes/my-nodes'),
        api.get('/revenue/my-earnings')
      ])

      setStats({
        groups: groupsRes.status === 'fulfilled' ? groupsRes.value.data?.length || 0 : 0,
        models: modelsRes.status === 'fulfilled' ? modelsRes.value.data?.length || 0 : 0,
        jobs: jobsRes.status === 'fulfilled' ? jobsRes.value.data?.length || 0 : 0,
        subscriptions: subscriptionsRes.status === 'fulfilled' ? subscriptionsRes.value.data?.length || 0 : 0,
        nodes: nodesRes.status === 'fulfilled' ? nodesRes.value.data?.length || 0 : 0,
        revenue: revenueRes.status === 'fulfilled' ? revenueRes.value.data?.total_earnings || '0.00' : '0.00'
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Group',
      description: 'Start a new collaborative project',
      icon: '👥',
      to: '/groups',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Upload Model',
      description: 'Share your AI models',
      icon: '🤖',
      to: '/groups',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Browse Marketplace',
      description: 'Discover AI services',
      icon: '🛒',
      to: '/marketplace',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Start Chat',
      description: 'Chat with AI models',
      icon: '💬',
      to: '/chat',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  const statCards = [
    {
      label: 'Groups',
      value: stats?.groups || 0,
      icon: '👥',
      color: 'blue',
      to: '/groups'
    },
    {
      label: 'Models',
      value: stats?.models || 0,
      icon: '🤖',
      color: 'purple',
      to: '/groups'
    },
    {
      label: 'Jobs',
      value: stats?.jobs || 0,
      icon: '⚙️',
      color: 'green',
      to: '/groups'
    },
    {
      label: 'Subscriptions',
      value: stats?.subscriptions || 0,
      icon: '📅',
      color: 'orange',
      to: '/marketplace'
    },
    {
      label: 'Nodes',
      value: stats?.nodes || 0,
      icon: '🖥️',
      color: 'indigo',
      to: '/nodes'
    },
    {
      label: 'Total Revenue',
      value: `$${parseFloat(stats?.revenue || '0').toFixed(2)}`,
      icon: '💰',
      color: 'emerald',
      to: '/revenue'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.username || 'User'}! 👋
          </h1>
          <p className="text-gray-600 text-lg">
            Here's what's happening with your AIForge Network account
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Link
              key={index}
              to={stat.to}
              className="card-hover p-6 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`text-3xl p-3 rounded-xl bg-gradient-to-br bg-${stat.color}-50`}>
                  {stat.icon}
                </div>
                {loading && (
                  <div className="animate-pulse h-8 w-16 bg-gray-200 rounded"></div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.to}
                className="card-hover p-6 group relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="relative">
                  <div className="text-4xl mb-4">{action.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                  <div className="mt-4 flex items-center text-blue-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Get started
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Platform Coin Portfolio - Coming Soon */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Platform Coin Portfolio</h2>
            <ComingSoon feature="Platform Coin" size="sm" />
          </div>
          <ComingSoon
            feature="AIForge Platform Coin Portfolio"
            description="In the future, you'll track your platform-native coin balance, staking rewards, and governance participation. Platform coins will replace USDT for all transactions. Currently using USDT (v1.0)."
            variant="card"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Groups */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Groups</h2>
              <Link to="/groups" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mr-3">👥</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">No groups yet</p>
                  <p className="text-sm text-gray-600">Create your first group to get started</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Models */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Models</h2>
              <Link to="/groups" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mr-3">🤖</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">No models yet</p>
                  <p className="text-sm text-gray-600">Upload your first model to share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
