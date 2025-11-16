import { useState, useEffect } from 'react'
import { adminApi, AdminStats } from '../api/admin'
import { systemApi } from '../api/admin'
import api from '../api/client'

type Tab = 'dashboard' | 'users' | 'groups' | 'models' | 'publishing' | 'payments' | 'subscriptions' | 'jobs' | 'nodes' | 'nfts' | 'infrastructure' | 'api-services' | 'revenue' | 'chat' | 'api-usage' | 'wallets' | 'system'

export default function Admin() {
  const [walletAddress, setWalletAddress] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).tronWeb) {
      const tronWeb = (window as any).tronWeb
      if (tronWeb.defaultAddress && tronWeb.defaultAddress.base58) {
        setWalletAddress(tronWeb.defaultAddress.base58)
        checkAdminStatus(tronWeb.defaultAddress.base58)
      }
    }
  }, [])

  useEffect(() => {
    if (isAdmin && walletAddress) {
      loadTabData()
    }
  }, [activeTab, page, isAdmin, walletAddress])

  const checkAdminStatus = async (address: string) => {
    if (!address) return
    
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/auth/check-admin', {
        params: {
          wallet_address: address,
          network: 'tron'
        }
      })
      setIsAdmin(response.data.is_admin)
      if (response.data.is_admin) {
        loadStats(address)
      }
    } catch (err: any) {
      console.error('Failed to check admin status:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to check admin status')
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (address: string) => {
    try {
      const statsData = await adminApi.getStats(address)
      setStats(statsData)
    } catch (err: any) {
      console.error('Failed to load stats:', err)
      setError(err.message || 'Failed to load stats')
    }
  }

  const loadTabData = async () => {
    if (!walletAddress) return
    
    try {
      setLoading(true)
      setError('')
      
      switch (activeTab) {
        case 'users':
          const users = await adminApi.getUsers(walletAddress, page, pageSize)
          setData(users)
          break
        case 'groups':
          const groups = await adminApi.getGroups(walletAddress, page, pageSize)
          setData(groups)
          break
        case 'models':
          const models = await adminApi.getModels(walletAddress, page, pageSize)
          setData(models)
          break
        case 'publishing':
          const publishing = await adminApi.getPublishing(walletAddress, page, pageSize)
          setData(publishing)
          break
        case 'payments':
          const payments = await adminApi.getPayments(walletAddress, page, pageSize)
          setData(payments)
          break
        case 'subscriptions':
          const subscriptions = await adminApi.getSubscriptions(walletAddress, page, pageSize)
          setData(subscriptions)
          break
        case 'jobs':
          const jobs = await adminApi.getJobs(walletAddress, page, pageSize)
          setData(jobs)
          break
        case 'nodes':
          const nodes = await adminApi.getNodes(walletAddress)
          setData(nodes)
          break
        case 'nfts':
          const nfts = await adminApi.getNFTs(walletAddress, page, pageSize)
          setData(nfts)
          break
        case 'infrastructure':
          const infrastructure = await adminApi.getInfrastructure(walletAddress, page, pageSize)
          setData(infrastructure)
          break
        case 'api-services':
          const services = await adminApi.getAPIServices(walletAddress, page, pageSize)
          setData(services)
          break
        case 'revenue':
          const revenueDistributions = await adminApi.getRevenueDistributions(walletAddress, page, pageSize)
          setData(revenueDistributions)
          break
        case 'chat':
          const conversations = await adminApi.getConversations(walletAddress, page, pageSize)
          setData(conversations)
          break
        case 'api-usage':
          const apiRequests = await adminApi.getAPIRequests(walletAddress, page, pageSize)
          setData(apiRequests)
          break
        case 'wallets':
          const wallets = await adminApi.getAdminWallets(walletAddress)
          setData({ wallets })
          break
        case 'system':
          // System settings tab handles its own data loading
          break
        default:
          await loadStats(walletAddress)
      }
    } catch (err: any) {
      console.error('Failed to load data:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const connectTronLink = async () => {
    if (typeof window === 'undefined' || !(window as any).tronWeb) {
      alert('Please install TronLink extension first!')
      return
    }

    try {
      const tronWeb = (window as any).tronWeb
      const accounts = await tronWeb.request({
        method: 'tron_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const address = accounts[0]
      setWalletAddress(address)
      await checkAdminStatus(address)
    } catch (err: any) {
      setError(err.message || 'Failed to connect TronLink')
    }
  }

  // Removed duplicate - handled in UsersTab component

  if (loading && !stats) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center">
          <p className="text-gray-600">Checking admin status...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Connect Admin Wallet</h2>
          <p className="text-gray-600 mb-4">
            Connect your admin wallet (TronLink) to access the admin dashboard.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={walletAddress || ''}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your Tron wallet address"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={connectTronLink}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Connect TronLink
              </button>
              {walletAddress && (
                <button
                  onClick={() => checkAdminStatus(walletAddress)}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
                >
                  Check Admin Status
                </button>
              )}
            </div>
          </div>

          {walletAddress && !isAdmin && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-400 text-yellow-700 rounded">
              <p className="font-semibold">Not an admin wallet</p>
              <p className="text-sm mt-1">
                The wallet address {walletAddress} is not in the admin whitelist.
                Please contact the platform administrator to add your wallet.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'groups', label: 'Groups', icon: '👨‍👩‍👧‍👦' },
    { id: 'models', label: 'Models', icon: '🤖' },
    { id: 'publishing', label: 'Publishing', icon: '📢' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '📅' },
    { id: 'jobs', label: 'Jobs', icon: '⚙️' },
    { id: 'nodes', label: 'Nodes', icon: '🖥️' },
    { id: 'nfts', label: 'NFTs', icon: '🎨' },
    { id: 'infrastructure', label: 'Infrastructure', icon: '☁️' },
    { id: 'api-services', label: 'API Services', icon: '🔌' },
    { id: 'revenue', label: 'Revenue & Payouts', icon: '💰' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'api-usage', label: 'API Usage', icon: '📈' },
    { id: 'wallets', label: 'Admin Wallets', icon: '🔐' },
    { id: 'system', label: 'System Settings', icon: '⚙️' }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-2 rounded inline-block">
          <p className="text-sm font-semibold">Admin Access Granted</p>
          <p className="text-xs">Wallet: {walletAddress}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.users.active} active</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Models</p>
                <p className="text-3xl font-bold text-gray-900">{stats.models.total}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${parseFloat(stats.payments.total_revenue || '0').toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Platform fees: ${parseFloat(stats.payments.platform_fees || '0').toFixed(2)}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.subscriptions.active}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.subscriptions.total} total</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Active Nodes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.nodes.active}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.nodes.total} total</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-sm text-gray-600">Completed Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.jobs.completed}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.jobs.total} total</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && data && (
          <UsersTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'system' && (
          <SystemSettingsTab walletAddress={walletAddress} />
        )}

        {activeTab === 'models' && data && (
          <ModelsTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'payments' && data && (
          <PaymentsTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'subscriptions' && data && (
          <SubscriptionsTab data={data} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'jobs' && data && (
          <JobsTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'nodes' && data && (
          <NodesTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} />
        )}

        {activeTab === 'nfts' && data && (
          <NFTsTab data={data} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'infrastructure' && data && (
          <InfrastructureTab data={data} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'api-services' && data && (
          <APIServicesTab data={data} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'wallets' && data && (
          <AdminWalletsTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} />
        )}

        {activeTab === 'groups' && data && (
          <GroupsTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'publishing' && data && (
          <PublishingTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'revenue' && data && (
          <RevenueTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'chat' && data && (
          <ChatTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {activeTab === 'api-usage' && data && (
          <APIUsageTab walletAddress={walletAddress} data={data} onRefresh={loadTabData} onPageChange={(p) => setPage(p)} />
        )}

        {loading && activeTab !== 'system' && (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Pagination Component
function Pagination({ page, total, pageSize, onPageChange }: { page: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  
  return (
    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page} of {totalPages} ({total} total)
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  )
}

// Users Tab
function UsersTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const [_selectedUser, setSelectedUser] = useState<any>(null)
  const [userDetails, setUserDetails] = useState<any>(null)

  const handleUserAction = async (userId: number, action: 'activate' | 'deactivate') => {
    try {
      if (action === 'activate') {
        await adminApi.activateUser(walletAddress, userId)
      } else {
        await adminApi.deactivateUser(walletAddress, userId)
      }
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || `Failed to ${action} user`)
    }
  }

  const handleViewDetails = async (userId: number) => {
    try {
      const details = await adminApi.getUserDetails(walletAddress, userId)
      setUserDetails(details)
      setSelectedUser(userId)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load user details')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Users ({data.total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.users && data.users.length > 0 ? data.users.map((user: any) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewDetails(user.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </button>
                    {user.is_active ? (
                      <button
                        onClick={() => handleUserAction(user.id, 'deactivate')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(user.id, 'activate')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.total > data.page_size && (
          <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
        )}
      </div>

      {userDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">User Details: {userDetails.user.email}</h3>
            <button
              onClick={() => {
                setSelectedUser(null)
                setUserDetails(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="space-y-1 text-sm">
                <div>Models: {userDetails.statistics.total_models}</div>
                <div>Groups: {userDetails.statistics.total_groups}</div>
                <div>Wallets: {userDetails.statistics.total_wallets}</div>
                <div>Payments: {userDetails.statistics.total_payments}</div>
                <div>Total Spent: ${parseFloat(userDetails.statistics.total_spent).toFixed(2)}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Wallets ({userDetails.wallets.length})</h4>
              <div className="space-y-1 text-sm">
                {userDetails.wallets.map((w: any) => (
                  <div key={w.id} className="text-gray-600">
                    {w.address.substring(0, 10)}... ({w.network})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Models Tab
function ModelsTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const handleFeature = async (modelId: number, featured: boolean) => {
    try {
      await adminApi.featureModel(walletAddress, modelId, featured)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update model')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Models ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.models && data.models.length > 0 ? data.models.map((model: any) => (
              <tr key={model.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Group {model.group_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${model.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {model.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(model.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleFeature(model.id, !model.featured)}
                    className={`px-3 py-1 rounded text-xs ${model.featured ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {model.featured ? 'Unfeature' : 'Feature'}
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No models found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Payments Tab
function PaymentsTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirming': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleVerify = async (paymentId: number) => {
    if (!confirm('Are you sure you want to manually verify this payment?')) return
    try {
      await adminApi.verifyPayment(walletAddress, paymentId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to verify payment')
    }
  }

  const handleCancel = async (paymentId: number) => {
    if (!confirm('Are you sure you want to cancel this payment?')) return
    try {
      await adminApi.cancelPayment(walletAddress, paymentId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel payment')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Payments ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TX Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.payments && data.payments.length > 0 ? data.payments.map((payment: any) => (
              <tr key={payment.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User {payment.from_wallet_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${parseFloat(payment.amount || '0').toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.currency || 'USDT'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                    {payment.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.payment_type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono text-xs">
                  {payment.tx_hash ? `${payment.tx_hash.substring(0, 10)}...` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {payment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleVerify(payment.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleCancel(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {payment.status === 'confirming' && (
                    <button
                      onClick={() => handleVerify(payment.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                  No payments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Subscriptions Tab
function SubscriptionsTab({ data, onPageChange }: { data: any; onPageChange: (page: number) => void }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Subscriptions ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.subscriptions && data.subscriptions.length > 0 ? data.subscriptions.map((sub: any) => (
              <tr key={sub.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sub.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">User {sub.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.plan_type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(sub.status)}`}>
                    {sub.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sub.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No subscriptions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Jobs Tab
function JobsTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const handleCancel = async (jobId: number) => {
    if (!confirm('Are you sure you want to cancel this job?')) return
    try {
      await adminApi.cancelJob(walletAddress, jobId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel job')
    }
  }

  const handleRetry = async (jobId: number) => {
    try {
      await adminApi.retryJob(walletAddress, jobId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to retry job')
    }
  }
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Jobs ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.jobs && data.jobs.length > 0 ? data.jobs.map((job: any) => (
              <tr key={job.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.job_id || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.type || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(job.status)}`}>
                    {job.status || 'Unknown'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(job.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {job.completed_at ? new Date(job.completed_at).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {(job.status === 'pending' || job.status === 'running' || job.status === 'assigned') && (
                    <button
                      onClick={() => handleCancel(job.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Cancel
                    </button>
                  )}
                  {job.status === 'failed' && (
                    <button
                      onClick={() => handleRetry(job.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Nodes Tab
function NodesTab({ walletAddress, data, onRefresh }: { walletAddress: string; data: any; onRefresh: () => void }) {
  const [_selectedNode, setSelectedNode] = useState<any>(null)
  const [nodeStats, setNodeStats] = useState<any>(null)

  const handleActivate = async (nodeId: number) => {
    try {
      await adminApi.activateNode(walletAddress, nodeId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to activate node')
    }
  }

  const handleDeactivate = async (nodeId: number) => {
    if (!confirm('Are you sure you want to deactivate this node?')) return
    try {
      await adminApi.deactivateNode(walletAddress, nodeId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to deactivate node')
    }
  }

  const handleViewStats = async (nodeId: number) => {
    try {
      const stats = await adminApi.getNodeStats(walletAddress, nodeId)
      setNodeStats(stats)
      setSelectedNode(nodeId)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load node stats')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Nodes ({data.nodes?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Heartbeat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.nodes && data.nodes.length > 0 ? data.nodes.map((node: any) => (
                <tr key={node.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{node.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.name || 'Unnamed'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${node.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {node.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.last_heartbeat ? new Date(node.last_heartbeat).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(node.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewStats(node.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Stats
                    </button>
                    {node.is_active ? (
                      <button
                        onClick={() => handleDeactivate(node.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(node.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No nodes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {nodeStats && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Node Statistics: {nodeStats.node.name}</h3>
            <button
              onClick={() => {
                setSelectedNode(null)
                setNodeStats(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Performance</h4>
              <div className="space-y-1 text-sm">
                <div>Jobs Assigned: {nodeStats.statistics.jobs_assigned}</div>
                <div>Jobs Completed: {nodeStats.statistics.jobs_completed}</div>
                <div>Jobs Failed: {nodeStats.statistics.jobs_failed}</div>
                <div>Success Rate: {nodeStats.statistics.success_rate.toFixed(2)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// NFTs Tab
function NFTsTab({ data, onPageChange }: { data: any; onPageChange: (page: number) => void }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">NFT Shares ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.nfts && data.nfts.length > 0 ? data.nfts.map((nft: any) => (
              <tr key={nft.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{nft.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{nft.token_id || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{nft.owner_address || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(nft.created_at).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No NFTs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Infrastructure Tab
function InfrastructureTab({ data, onPageChange }: { data: any; onPageChange: (page: number) => void }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Infrastructure Investments ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.investments && data.investments.length > 0 ? data.investments.map((inv: any) => (
              <tr key={inv.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.name || 'Unnamed'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">User {inv.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  ${parseFloat(inv.investment_amount || '0').toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${inv.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {inv.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(inv.created_at).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No infrastructure investments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// API Services Tab
function APIServicesTab({ data, onPageChange }: { data: any; onPageChange: (page: number) => void }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">API Services ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.services && data.services.length > 0 ? data.services.map((service: any) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{service.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name || 'Unnamed'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">User {service.user_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${service.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {service.is_public ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(service.created_at).toLocaleDateString()}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No API services found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Admin Wallets Tab
function AdminWalletsTab({ walletAddress, data, onRefresh }: { walletAddress: string; data: any; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newWallet, setNewWallet] = useState({ wallet_address: '', network: 'tron', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!newWallet.wallet_address) {
      alert('Please enter a wallet address')
      return
    }
    setLoading(true)
    try {
      await adminApi.addAdminWallet(walletAddress, newWallet)
      setShowAdd(false)
      setNewWallet({ wallet_address: '', network: 'tron', notes: '' })
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to add admin wallet')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (walletId: number) => {
    if (!confirm('Are you sure you want to remove this admin wallet?')) return
    try {
      await adminApi.removeAdminWallet(walletAddress, walletId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove admin wallet')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Admin Wallets ({data.wallets?.length || 0})</h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Wallet
        </button>
      </div>

      {showAdd && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium mb-3">Add New Admin Wallet</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Wallet Address"
              value={newWallet.wallet_address}
              onChange={(e) => setNewWallet({ ...newWallet, wallet_address: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newWallet.network}
              onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="tron">Tron</option>
              <option value="ethereum">Ethereum</option>
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={newWallet.notes}
              onChange={(e) => setNewWallet({ ...newWallet, notes: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Network</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.wallets && data.wallets.length > 0 ? data.wallets.map((wallet: any) => (
              <tr key={wallet.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wallet.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{wallet.wallet_address}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{wallet.network}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${wallet.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {wallet.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{wallet.notes || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {wallet.is_active && (
                    <button
                      onClick={() => handleRemove(wallet.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No admin wallets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SystemSettingsTab({ walletAddress }: { walletAddress: string }) {
  const [activeSection, setActiveSection] = useState<'maintenance' | 'settings' | 'features' | 'health' | 'logs'>('maintenance')
  const [_loading, _setLoading] = useState(false)
  const [_error, _setError] = useState('')

  const sections = [
    { id: 'maintenance' as const, label: 'Maintenance Mode', icon: '🔧' },
    { id: 'settings' as const, label: 'Configuration', icon: '⚙️' },
    { id: 'features' as const, label: 'Feature Flags', icon: '🚩' },
    { id: 'health' as const, label: 'System Health', icon: '💚' },
    { id: 'logs' as const, label: 'System Logs', icon: '📋' }
  ]

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      {_error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {_error}
        </div>
      )}

      {/* Section Content */}
      <div className="mt-6">
        {activeSection === 'maintenance' && (
          <MaintenanceModeControl walletAddress={walletAddress} />
        )}
        {activeSection === 'settings' && (
          <ConfigurationManagement walletAddress={walletAddress} />
        )}
        {activeSection === 'features' && (
          <FeatureFlagsManagement walletAddress={walletAddress} />
        )}
        {activeSection === 'health' && (
          <SystemHealthMonitor walletAddress={walletAddress} />
        )}
        {activeSection === 'logs' && (
          <SystemLogsViewer walletAddress={walletAddress} />
        )}
      </div>
    </div>
  )
}

function MaintenanceModeControl({ walletAddress }: { walletAddress: string }) {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      const status = await systemApi.getMaintenanceMode(walletAddress)
      setEnabled(status.enabled)
      setMessage(status.message || '')
    } catch (err) {
      console.error('Failed to load maintenance mode:', err)
    }
  }

  const handleToggle = async () => {
    setLoading(true)
    try {
      await systemApi.setMaintenanceMode(walletAddress, !enabled, message)
      setEnabled(!enabled)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update maintenance mode')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMessage = async () => {
    setLoading(true)
    try {
      await systemApi.setMaintenanceMode(walletAddress, enabled, message)
      alert('Maintenance message updated successfully')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update maintenance message')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">Maintenance Mode</p>
          <p className="text-sm text-gray-600">Enable to put the platform in maintenance mode</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleToggle}
            disabled={loading}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      {enabled && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter maintenance message for users..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            rows={3}
          />
          <button
            onClick={handleUpdateMessage}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Update Message
          </button>
        </div>
      )}
    </div>
  )
}

function ConfigurationManagement({ walletAddress }: { walletAddress: string }) {
  const [settings, setSettings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newSetting, setNewSetting] = useState({ key: '', value: '', value_type: 'string', category: 'general', description: '', is_public: false })

  useEffect(() => {
    loadSettings()
  }, [selectedCategory])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const data = await systemApi.getSettings(walletAddress, selectedCategory || undefined)
      setSettings(data)
    } catch (err: any) {
      console.error('Failed to load settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (key: string) => {
    try {
      await systemApi.updateSetting(walletAddress, key, { value: editValue })
      setEditingKey(null)
      loadSettings()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update setting')
    }
  }

  const handleCreate = async () => {
    try {
      await systemApi.createSetting(walletAddress, newSetting)
      setShowCreate(false)
      setNewSetting({ key: '', value: '', value_type: 'string', category: 'general', description: '', is_public: false })
      loadSettings()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create setting')
    }
  }

  const categories = Array.from(new Set(settings.map(s => s.category)))

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Configuration Management</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Setting
        </button>
      </div>

      {showCreate && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Create New Setting</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Key"
              value={newSetting.key}
              onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="Value"
              value={newSetting.value}
              onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newSetting.value_type}
              onChange={(e) => setNewSetting({ ...newSetting, value_type: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="json">JSON</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={newSetting.category}
              onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <textarea
            placeholder="Description"
            value={newSetting.description}
            onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={2}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={newSetting.is_public}
              onChange={(e) => setNewSetting({ ...newSetting, is_public: e.target.checked })}
              className="rounded"
            />
            <label className="text-sm">Public (accessible by non-admins)</label>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 rounded ${selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.length > 0 ? settings.map((setting: any) => (
                <tr key={setting.key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{setting.key}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <span className="truncate max-w-xs block">{setting.value}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{setting.value_type}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{setting.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {editingKey === setting.key ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUpdate(setting.key)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingKey(setting.key)
                          setEditValue(setting.value)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No settings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FeatureFlagsManagement({ walletAddress }: { walletAddress: string }) {
  const [flags, setFlags] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newFlag, setNewFlag] = useState({ name: '', enabled: false, description: '', rollout_percentage: 100 })

  useEffect(() => {
    loadFlags()
  }, [])

  const loadFlags = async () => {
    setLoading(true)
    try {
      const data = await systemApi.getFeatureFlags(walletAddress)
      setFlags(data)
    } catch (err: any) {
      console.error('Failed to load feature flags:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (name: string, currentEnabled: boolean) => {
    try {
      await systemApi.updateFeatureFlag(walletAddress, name, { enabled: !currentEnabled })
      loadFlags()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update feature flag')
    }
  }

  const handleUpdateRollout = async (name: string, percentage: number) => {
    try {
      await systemApi.updateFeatureFlag(walletAddress, name, { rollout_percentage: percentage })
      loadFlags()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update rollout percentage')
    }
  }

  const handleCreate = async () => {
    try {
      await systemApi.createFeatureFlag(walletAddress, newFlag)
      setShowCreate(false)
      setNewFlag({ name: '', enabled: false, description: '', rollout_percentage: 100 })
      loadFlags()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create feature flag')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Feature Flags</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add Feature Flag
        </button>
      </div>

      {showCreate && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-medium">Create New Feature Flag</h3>
          <input
            type="text"
            placeholder="Feature Name"
            value={newFlag.name}
            onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <textarea
            placeholder="Description"
            value={newFlag.description}
            onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows={2}
          />
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={newFlag.enabled}
                onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                className="rounded"
              />
              <span>Enabled</span>
            </label>
            <div className="flex items-center space-x-2">
              <label>Rollout %:</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newFlag.rollout_percentage}
                onChange={(e) => setNewFlag({ ...newFlag, rollout_percentage: parseInt(e.target.value) })}
                className="w-20 border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : flags.length > 0 ? (
        <div className="space-y-3">
          {flags.map((flag: any) => (
            <div key={flag.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-medium text-lg">{flag.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                  )}
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Rollout:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={flag.rollout_percentage}
                        onChange={(e) => handleUpdateRollout(flag.name, parseInt(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={() => handleToggle(flag.name, flag.enabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8">No feature flags found</p>
      )}
    </div>
  )
}

function SystemHealthMonitor({ walletAddress }: { walletAddress: string }) {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const loadHealth = async () => {
    setLoading(true)
    try {
      const data = await systemApi.getSystemHealth(walletAddress)
      setHealth(data)
    } catch (err: any) {
      console.error('Failed to load system health:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHealth()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadHealth, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600'
  const getStatusIcon = (status: boolean) => status ? '✓' : '✗'

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Health</h2>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh (5s)</span>
          </label>
          <button
            onClick={loadHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && !health ? (
        <p className="text-gray-600">Loading...</p>
      ) : health ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${health.status === 'healthy' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Overall Status</h3>
                <p className={`text-2xl font-bold ${health.status === 'healthy' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {health.status.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Version</p>
                <p className="font-medium">{health.version}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Database</span>
                <span className={`text-xl ${getStatusColor(health.database)}`}>
                  {getStatusIcon(health.database)}
                </span>
              </div>
              <p className={`text-sm ${getStatusColor(health.database)}`}>
                {health.database ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Redis</span>
                <span className={`text-xl ${getStatusColor(health.redis)}`}>
                  {getStatusIcon(health.redis)}
                </span>
              </div>
              <p className={`text-sm ${getStatusColor(health.redis)}`}>
                {health.redis ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">IPFS</span>
                <span className={`text-xl ${getStatusColor(health.ipfs)}`}>
                  {getStatusIcon(health.ipfs)}
                </span>
              </div>
              <p className={`text-sm ${getStatusColor(health.ipfs)}`}>
                {health.ipfs ? 'Connected' : 'Disconnected'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">MinIO</span>
                <span className={`text-xl ${getStatusColor(health.minio)}`}>
                  {getStatusIcon(health.minio)}
                </span>
              </div>
              <p className={`text-sm ${getStatusColor(health.minio)}`}>
                {health.minio ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SystemLogsViewer({ walletAddress }: { walletAddress: string }) {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [limit, setLimit] = useState(100)

  useEffect(() => {
    loadLogs()
  }, [selectedCategory, limit])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const data = await systemApi.getSystemLogs(walletAddress, selectedCategory || undefined, limit)
      setLogs(data)
    } catch (err: any) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const categories = Array.from(new Set(logs.map(log => log.category)))

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">System Logs</h2>
        <div className="flex items-center space-x-3">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value={50}>50 logs</option>
            <option value={100}>100 logs</option>
            <option value={200}>200 logs</option>
            <option value={500}>500 logs</option>
          </select>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 rounded ${selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length > 0 ? logs.map((log: any, idx: number) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.action}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{log.category}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{log.performed_by_wallet || 'System'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">View</summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-w-md">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    No logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Groups Tab
function GroupsTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [groupDetails, setGroupDetails] = useState<any>(null)

  const handleViewDetails = async (groupId: number) => {
    try {
      const details = await adminApi.getGroupDetails(walletAddress, groupId)
      setGroupDetails(details)
      setSelectedGroup(groupId)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load group details')
    }
  }

  const handleDelete = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return
    try {
      await adminApi.deleteGroup(walletAddress, groupId)
      onRefresh()
      if (selectedGroup === groupId) {
        setSelectedGroup(null)
        setGroupDetails(null)
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete group')
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Groups ({data.total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Models</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.groups && data.groups.length > 0 ? data.groups.map((group: any) => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{group.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${group.is_public ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {group.is_public ? 'Public' : 'Private'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.member_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.model_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(group.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewDetails(group.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No groups found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.total > data.page_size && (
          <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
        )}
      </div>

      {groupDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Group Details: {groupDetails.group.name}</h3>
            <button
              onClick={() => {
                setSelectedGroup(null)
                setGroupDetails(null)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Members ({groupDetails.members.length})</h4>
              <div className="space-y-1">
                {groupDetails.members.map((m: any) => (
                  <div key={m.id} className="text-sm text-gray-600">
                    User {m.user_id} - {m.role}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Models ({groupDetails.models.length})</h4>
              <div className="space-y-1">
                {groupDetails.models.map((m: any) => (
                  <div key={m.id} className="text-sm text-gray-600">
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Publishing Tab
function PublishingTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const handleSuspend = async (publishingId: number) => {
    if (!confirm('Are you sure you want to suspend this model?')) return
    try {
      await adminApi.suspendPublishing(walletAddress, publishingId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to suspend publishing')
    }
  }

  const handleUnsuspend = async (publishingId: number) => {
    try {
      await adminApi.unsuspendPublishing(walletAddress, publishingId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to unsuspend publishing')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: { [key: string]: string } = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      pending_payment: 'bg-yellow-100 text-yellow-800',
      listing_expired: 'bg-orange-100 text-orange-800',
      suspended: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Model Publishing ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Published</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.publishing && data.publishing.length > 0 ? data.publishing.map((pub: any) => (
              <tr key={pub.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pub.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pub.model_name || `Model ${pub.model_id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(pub.status)}`}>
                    {pub.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pub.publishing_fee_paid ? '✓' : '✗'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pub.published_at ? new Date(pub.published_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  {pub.status === 'published' && (
                    <button
                      onClick={() => handleSuspend(pub.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Suspend
                    </button>
                  )}
                  {pub.status === 'suspended' && (
                    <button
                      onClick={() => handleUnsuspend(pub.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Unsuspend
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No publishing records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// Revenue Tab
function RevenueTab({ walletAddress, data, onRefresh: _onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const [activeSection, setActiveSection] = useState<'distributions' | 'nft-pools'>('distributions')
  const [nftPools, setNftPools] = useState<any>(null)

  useEffect(() => {
    if (activeSection === 'nft-pools') {
      adminApi.getNFTRewardPools(walletAddress, 1, 20).then(setNftPools)
    }
  }, [activeSection, walletAddress])

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('distributions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'distributions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Revenue Distributions
          </button>
          <button
            onClick={() => setActiveSection('nft-pools')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'nft-pools'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            NFT Reward Pools
          </button>
        </nav>
      </div>

      {activeSection === 'distributions' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Revenue Distributions ({data.total})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model Pool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.distributions && data.distributions.length > 0 ? data.distributions.map((dist: any) => (
                  <tr key={dist.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dist.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {dist.model_name || `Model ${dist.model_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dist.period_year}-{String(dist.period_month).padStart(2, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(dist.total_revenue).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${parseFloat(dist.platform_fee).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(dist.model_pool).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${dist.is_distributed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {dist.is_distributed ? 'Distributed' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                      No distributions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.total > data.page_size && (
            <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
          )}
        </div>
      )}

      {activeSection === 'nft-pools' && nftPools && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">NFT Reward Pools ({nftPools.total})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pool</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Shares</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reward/Share</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nftPools.pools && nftPools.pools.length > 0 ? nftPools.pools.map((pool: any) => (
                  <tr key={pool.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pool.period}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(pool.total_pool).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pool.total_shares}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(pool.reward_per_share).toFixed(4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${pool.is_distributed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {pool.is_distributed ? 'Distributed' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pool.calculated_at ? new Date(pool.calculated_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No reward pools found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {nftPools.total > nftPools.page_size && (
            <Pagination page={nftPools.page} total={nftPools.total} pageSize={nftPools.page_size} onPageChange={(p) => {
              adminApi.getNFTRewardPools(walletAddress, p, 20).then(setNftPools)
            }} />
          )}
        </div>
      )}
    </div>
  )
}

// Chat Tab
function ChatTab({ walletAddress, data, onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const handleDelete = async (conversationId: number) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return
    try {
      await adminApi.deleteConversation(walletAddress, conversationId)
      onRefresh()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete conversation')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Conversations ({data.total})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.conversations && data.conversations.length > 0 ? data.conversations.map((conv: any) => (
              <tr key={conv.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{conv.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">User {conv.user_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{conv.title || 'Untitled'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{conv.message_count || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${conv.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {conv.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(conv.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No conversations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data.total > data.page_size && (
        <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// API Usage Tab
function APIUsageTab({ walletAddress, data, onRefresh: _onRefresh, onPageChange }: { walletAddress: string; data: any; onRefresh: () => void; onPageChange: (page: number) => void }) {
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    adminApi.getAPIUsageStats(walletAddress).then(setStats)
  }, [walletAddress])

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Requests</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_requests || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Successful</p>
            <p className="text-3xl font-bold text-green-600">{stats.successful_requests || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-3xl font-bold text-red-600">{stats.failed_requests || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Cost</p>
            <p className="text-3xl font-bold text-gray-900">${parseFloat(stats.total_cost || '0').toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.total_tokens || 0} tokens</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">API Requests ({data.total})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.requests && data.requests.length > 0 ? data.requests.map((req: any) => (
                <tr key={req.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Service {req.service_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.tokens_used || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${parseFloat(req.cost || '0').toFixed(4)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      req.status === 'success' ? 'bg-green-100 text-green-800' :
                      req.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No API requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {data.total > data.page_size && (
          <Pagination page={data.page} total={data.total} pageSize={data.page_size} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
