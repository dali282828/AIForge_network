import { useState, useEffect } from 'react'
import api from '../api/client'

interface Node {
  node_id: string
  name: string
  description: string | null
  is_active: boolean
  last_heartbeat: string | null
  operating_system: string | null
  model_runner_type: string | null
  model_runner_version: string | null
  gpu_enabled: boolean
  max_concurrent_jobs: number
  total_jobs_completed: number
  total_jobs_failed: number
  total_earnings: string
  pending_earnings: string
  wallet_address: string | null
  wallet_network: string | null
  node_type: string | null
  created_at: string
}

export default function Nodes() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'inference' | 'training'>('all')

  useEffect(() => {
    loadNodes(true) // Show loading on initial load
    
    // Auto-refresh every 10 seconds to update node status (without loading spinner)
    const interval = setInterval(() => {
      loadNodes(false) // Don't show loading spinner on auto-refresh
    }, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const loadNodes = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      setError(null)
      const response = await api.get('/nodes/my-nodes')
      const nodesData = response.data || []
      
      // Debug logging
      console.log('Loaded nodes:', nodesData.length, 'nodes')
      if (nodesData.length > 0) {
        console.log('Node IDs:', nodesData.map((n: Node) => n.node_id))
        console.log('Node names:', nodesData.map((n: Node) => n.name))
      }
      
      // Ensure we set all nodes (no filtering)
      setNodes(nodesData)
    } catch (err: any) {
      console.error('Failed to load nodes:', err)
      setError(err.response?.data?.detail || 'Failed to load nodes')
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (node: Node) => {
    if (!node.is_active) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>
    }
    
    if (!node.last_heartbeat) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">No Heartbeat</span>
    }
    
    const lastHeartbeat = new Date(node.last_heartbeat)
    const now = new Date()
    // Handle timezone-aware dates properly
    const lastHeartbeatTime = lastHeartbeat.getTime()
    const nowTime = now.getTime()
    const diffMinutes = (nowTime - lastHeartbeatTime) / 1000 / 60
    
    // Thresholds: 2 minutes for online (heartbeats every 30s), 5 minutes for stale
    if (diffMinutes < 2) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Online</span>
    } else if (diffMinutes < 5) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Stale</span>
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Offline</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            My Nodes 🖥️
          </h1>
          <p className="text-gray-600 text-lg">
            Manage and monitor your compute nodes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading nodes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && nodes.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🖥️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Nodes Found</h2>
            <p className="text-gray-600 mb-6">
              You haven't registered any nodes yet. Start by running the Electron app and registering your first node.
            </p>
            <div className="text-sm text-gray-500">
              <p>Nodes are registered automatically when you run the Electron desktop app.</p>
              <p className="mt-2">Make sure to use the same wallet address you used to log in.</p>
            </div>
          </div>
        )}

        {/* Filter and Node Count */}
        {!loading && !error && nodes.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold">{nodes.length}</span> node{nodes.length !== 1 ? 's' : ''} registered with your wallet address
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All ({nodes.length})
              </button>
              <button
                onClick={() => setFilterType('inference')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'inference'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Inference ({nodes.filter(n => (n.node_type || 'inference') === 'inference').length})
              </button>
              <button
                onClick={() => setFilterType('training')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'training'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Training ({nodes.filter(n => n.node_type === 'training').length})
              </button>
            </div>
          </div>
        )}

        {/* Nodes Grid */}
        {!loading && !error && nodes.length > 0 && (() => {
          const filteredNodes = filterType === 'all' 
            ? nodes 
            : nodes.filter(n => {
                const nodeType = n.node_type || 'inference'
                return filterType === 'inference' ? nodeType === 'inference' : nodeType === 'training'
              })
          
          if (filteredNodes.length === 0) {
            return (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No {filterType} nodes found</h2>
                <p className="text-gray-600">
                  You don't have any {filterType} nodes registered yet.
                </p>
              </div>
            )
          }
          
          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredNodes.map((node) => {
                const nodeType = node.node_type || 'inference'
                return (
                  <div key={node.node_id} className="card p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{node.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            nodeType === 'training'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {nodeType === 'training' ? 'Training' : 'Inference'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono">{node.node_id}</p>
                      </div>
                      {getStatusBadge(node)}
                    </div>

                {node.description && (
                  <p className="text-gray-600 mb-4">{node.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Operating System</p>
                    <p className="text-sm font-medium text-gray-900">
                      {node.operating_system ? node.operating_system.charAt(0).toUpperCase() + node.operating_system.slice(1) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Model Runner</p>
                    <p className="text-sm font-medium text-gray-900">
                      {node.model_runner_type ? node.model_runner_type.charAt(0).toUpperCase() + node.model_runner_type.slice(1) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">GPU Enabled</p>
                    <p className="text-sm font-medium text-gray-900">
                      {node.gpu_enabled ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Max Concurrent Jobs</p>
                    <p className="text-sm font-medium text-gray-900">{node.max_concurrent_jobs}</p>
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Jobs Completed</p>
                      <p className="text-lg font-bold text-green-600">{node.total_jobs_completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Jobs Failed</p>
                      <p className="text-lg font-bold text-red-600">{node.total_jobs_failed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Earnings</p>
                      <p className="text-lg font-bold text-emerald-600">{parseFloat(node.total_earnings).toFixed(4)} USDT</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending Earnings</p>
                      <p className="text-lg font-bold text-yellow-600">{parseFloat(node.pending_earnings).toFixed(4)} USDT</p>
                    </div>
                  </div>
                </div>

                {node.wallet_address && (
                  <div className="border-t pt-4 mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wallet Address</p>
                    <p className="text-sm font-mono text-gray-900 break-all">{node.wallet_address}</p>
                    {node.wallet_network && (
                      <p className="text-xs text-gray-500 mt-1">Network: {node.wallet_network}</p>
                    )}
                  </div>
                )}

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Last Heartbeat: {formatDate(node.last_heartbeat)}</span>
                        <span>Created: {formatDate(node.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Info Card */}
        {!loading && nodes.length > 0 && (
          <div className="mt-8 card p-6 bg-blue-50 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-2">💡 Node Management Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Nodes automatically register when you run the Electron desktop app</li>
              <li>• Make sure to use the same wallet address you used to log in</li>
              <li>• Nodes send heartbeats every 30 seconds to show they're online</li>
              <li>• Status updates automatically every 10 seconds</li>
              <li>• Earnings are distributed automatically when jobs complete</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

