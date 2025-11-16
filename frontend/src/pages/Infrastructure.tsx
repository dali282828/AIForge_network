import { useState, useEffect } from 'react'
import { infrastructureApi, InfrastructureInvestment, InfrastructureStats } from '../api/infrastructure'

export default function Infrastructure() {
  const [investments, setInvestments] = useState<InfrastructureInvestment[]>([])
  const [stats, setStats] = useState<InfrastructureStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    provider: 'aws' as const,
    infrastructure_type: 'gpu' as const,
    resource_specs: {} as Record<string, any>,
    group_id: undefined as number | undefined
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [investmentsData, statsData] = await Promise.all([
        infrastructureApi.getMyInvestments(),
        infrastructureApi.getStats()
      ])
      setInvestments(investmentsData.investments)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load infrastructure data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      await infrastructureApi.createInvestment(formData)
      setShowCreateForm(false)
      setFormData({
        provider: 'aws',
        infrastructure_type: 'gpu',
        resource_specs: {},
        group_id: undefined
      })
      await loadData()
    } catch (error: any) {
      console.error('Failed to create investment:', error)
      alert(error.response?.data?.detail || 'Failed to create investment')
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (investmentId: number) => {
    try {
      await infrastructureApi.activate(investmentId)
      await loadData()
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to activate investment')
    }
  }

  const totalEarnings = investments.reduce((sum, inv) => sum + parseFloat(inv.total_earnings || '0'), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Infrastructure Investment</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ New Investment'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Investments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_investments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active_investments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-2xl font-bold text-blue-600">{stats.available_investments}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Earnings</p>
            <p className="text-2xl font-bold text-gray-900">${parseFloat(stats.total_earnings).toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Infrastructure Investment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="aws">AWS</option>
                <option value="vultr">Vultr</option>
                <option value="gcp">Google Cloud</option>
                <option value="runpod">RunPod</option>
                <option value="vast_ai">Vast.ai</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Infrastructure Type</label>
              <select
                value={formData.infrastructure_type}
                onChange={(e) => setFormData({ ...formData, infrastructure_type: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="gpu">GPU</option>
                <option value="cpu">CPU</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource Specs (JSON)</label>
              <textarea
                value={JSON.stringify(formData.resource_specs, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData({ ...formData, resource_specs: JSON.parse(e.target.value) })
                  } catch {}
                }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono text-sm"
                rows={4}
                placeholder='{"gpu_type": "A100", "cpu_cores": 8, "memory": "32GB"}'
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Create Investment
            </button>
          </div>
        </div>
      )}

      {/* My Investments */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Investments</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-3xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
        </div>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : investments.length === 0 ? (
          <p className="text-gray-600">You don't have any investments yet. Create one above!</p>
        ) : (
          <div className="space-y-4">
            {investments.map((inv) => (
              <div key={inv.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {inv.provider.toUpperCase()} - {inv.infrastructure_type.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: <span className={`font-medium ${
                        inv.status === 'active' ? 'text-green-600' : 'text-gray-600'
                      }`}>{inv.status}</span>
                    </p>
                    {inv.allocated_to_model_id && (
                      <p className="text-sm text-gray-600">
                        Allocated to Model ID: {inv.allocated_to_model_id}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      Earnings: <span className="font-semibold text-green-600">
                        ${parseFloat(inv.total_earnings).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => handleActivate(inv.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

