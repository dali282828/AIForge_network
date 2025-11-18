import api from './client'

export interface AdminStats {
  users: { total: number; active: number }
  subscriptions: { total: number; active: number }
  payments: { total: number; confirmed: number; total_revenue: string; platform_fees: string }
  nodes: { total: number; active: number; training: number; inference: number }
  jobs: { total: number; completed: number }
  models: { total: number }
  groups: { total: number; training: number; inference: number; both: number }
  experiments: { total: number; active: number; runs: number; completed_runs: number; versions: number; tests: number }
  workspace: { projects: number; active_projects: number; tasks: number; completed_tasks: number }
  encryption: { total_keys: number }
}

export interface PaginatedResponse<T> {
  [key: string]: T[] | number
  total: number
  page: number
  page_size: number
}

const getAdminHeaders = (walletAddress: string, network: string = 'tron') => ({
  'x-wallet-address': walletAddress,
  'x-wallet-network': network
})

export const adminApi = {
  // Stats
  getStats: async (walletAddress: string): Promise<AdminStats> => {
    const response = await api.get('/admin/stats', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Users
  getUsers: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/users', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  activateUser: async (walletAddress: string, userId: number) => {
    const response = await api.patch(`/admin/users/${userId}/activate`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deactivateUser: async (walletAddress: string, userId: number) => {
    const response = await api.patch(`/admin/users/${userId}/deactivate`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Models
  getModels: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/models', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  featureModel: async (walletAddress: string, modelId: number, featured: boolean = true) => {
    const response = await api.patch(`/admin/models/${modelId}/feature`, { featured }, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Payments
  getPayments: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/payments', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Subscriptions
  getSubscriptions: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/subscriptions', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Jobs
  getJobs: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/jobs', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Nodes
  getNodes: async (walletAddress: string) => {
    const response = await api.get('/admin/nodes', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // NFTs
  getNFTs: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/nfts', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Infrastructure
  getInfrastructure: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/infrastructure', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // API Services
  getAPIServices: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/api-services', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Admin Wallets
  getAdminWallets: async (walletAddress: string) => {
    const response = await api.get('/admin/wallets', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  addAdminWallet: async (walletAddress: string, data: { wallet_address: string; network: string; notes?: string }) => {
    const response = await api.post('/admin/wallets/add', data, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  removeAdminWallet: async (walletAddress: string, walletId: number) => {
    const response = await api.delete(`/admin/wallets/${walletId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Groups
  getGroups: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/groups', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getGroupDetails: async (walletAddress: string, groupId: number) => {
    const response = await api.get(`/admin/groups/${groupId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  suspendGroup: async (walletAddress: string, groupId: number) => {
    const response = await api.patch(`/admin/groups/${groupId}/suspend`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  activateGroup: async (walletAddress: string, groupId: number) => {
    const response = await api.patch(`/admin/groups/${groupId}/activate`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deleteGroup: async (walletAddress: string, groupId: number) => {
    const response = await api.delete(`/admin/groups/${groupId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Publishing
  getPublishing: async (walletAddress: string, page: number = 1, pageSize: number = 20, statusFilter?: string) => {
    const response = await api.get('/admin/publishing', {
      params: { page, page_size: pageSize, status_filter: statusFilter },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  suspendPublishing: async (walletAddress: string, publishingId: number) => {
    const response = await api.patch(`/admin/publishing/${publishingId}/suspend`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  unsuspendPublishing: async (walletAddress: string, publishingId: number) => {
    const response = await api.patch(`/admin/publishing/${publishingId}/unsuspend`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  approvePublishing: async (walletAddress: string, publishingId: number) => {
    const response = await api.patch(`/admin/publishing/${publishingId}/approve`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  rejectPublishing: async (walletAddress: string, publishingId: number, reason?: string) => {
    const response = await api.patch(`/admin/publishing/${publishingId}/reject`, { reason }, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Revenue & Payouts
  getRevenueDistributions: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/revenue/distributions', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getNFTRewardPools: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/revenue/nft-pools', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  triggerRevenueDistribution: async (walletAddress: string, distributionId: number) => {
    const response = await api.post(`/admin/revenue/distributions/${distributionId}/trigger`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getInfrastructurePayouts: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/revenue/infrastructure-payouts', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Chat/Conversations
  getConversations: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/chat/conversations', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deleteConversation: async (walletAddress: string, conversationId: number) => {
    const response = await api.delete(`/admin/chat/conversations/${conversationId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // API Usage
  getAPIRequests: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/api-usage/requests', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getAPIUsageStats: async (walletAddress: string) => {
    const response = await api.get('/admin/api-usage/stats', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Payment Management Enhancements
  verifyPayment: async (walletAddress: string, paymentId: number) => {
    const response = await api.patch(`/admin/payments/${paymentId}/verify`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  cancelPayment: async (walletAddress: string, paymentId: number) => {
    const response = await api.patch(`/admin/payments/${paymentId}/cancel`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // User Management Enhancements
  getUserDetails: async (walletAddress: string, userId: number) => {
    const response = await api.get(`/admin/users/${userId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Job Management Enhancements
  cancelJob: async (walletAddress: string, jobId: number) => {
    const response = await api.patch(`/admin/jobs/${jobId}/cancel`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  retryJob: async (walletAddress: string, jobId: number) => {
    const response = await api.post(`/admin/jobs/${jobId}/retry`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Node Management Enhancements
  activateNode: async (walletAddress: string, nodeId: number) => {
    const response = await api.patch(`/admin/nodes/${nodeId}/activate`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deactivateNode: async (walletAddress: string, nodeId: number) => {
    const response = await api.patch(`/admin/nodes/${nodeId}/deactivate`, {}, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getNodeStats: async (walletAddress: string, nodeId: number) => {
    const response = await api.get(`/admin/nodes/${nodeId}/stats`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Experiments
  getExperiments: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/experiments', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getExperimentRuns: async (walletAddress: string, experimentId: number) => {
    const response = await api.get(`/admin/experiments/${experimentId}/runs`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getModelVersions: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/model-versions', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getInferenceTests: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/inference-tests', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Workspace
  getWorkspaceProjects: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/workspace/projects', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getWorkspaceTasks: async (walletAddress: string, page: number = 1, pageSize: number = 20) => {
    const response = await api.get('/admin/workspace/tasks', {
      params: { page, page_size: pageSize },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Encryption Keys
  getEncryptionKeys: async (walletAddress: string) => {
    const response = await api.get('/admin/encryption-keys', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getGroupEncryptionKey: async (walletAddress: string, groupId: number) => {
    const response = await api.get(`/admin/encryption-keys/${groupId}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  }
}

export const systemApi = {
  // Settings
  getSettings: async (walletAddress: string, category?: string) => {
    const response = await api.get('/system/settings', {
      params: category ? { category } : {},
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  getSetting: async (walletAddress: string, key: string) => {
    const response = await api.get(`/system/settings/${key}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  createSetting: async (walletAddress: string, data: any) => {
    const response = await api.post('/system/settings', data, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  updateSetting: async (walletAddress: string, key: string, data: any) => {
    const response = await api.patch(`/system/settings/${key}`, data, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deleteSetting: async (walletAddress: string, key: string) => {
    const response = await api.delete(`/system/settings/${key}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Feature Flags
  getFeatureFlags: async (walletAddress: string) => {
    const response = await api.get('/system/feature-flags', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  createFeatureFlag: async (walletAddress: string, data: any) => {
    const response = await api.post('/system/feature-flags', data, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  updateFeatureFlag: async (walletAddress: string, name: string, data: any) => {
    const response = await api.patch(`/system/feature-flags/${name}`, data, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  deleteFeatureFlag: async (walletAddress: string, name: string) => {
    const response = await api.delete(`/system/feature-flags/${name}`, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // Maintenance Mode
  getMaintenanceMode: async (walletAddress: string) => {
    const response = await api.get('/system/maintenance-mode', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  setMaintenanceMode: async (walletAddress: string, enabled: boolean, message?: string) => {
    const response = await api.post('/system/maintenance-mode', { enabled, message }, {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // System Health
  getSystemHealth: async (walletAddress: string) => {
    const response = await api.get('/system/health', {
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  },

  // System Logs
  getSystemLogs: async (walletAddress: string, category?: string, limit: number = 100) => {
    const response = await api.get('/system/logs', {
      params: { category, limit },
      headers: getAdminHeaders(walletAddress)
    })
    return response.data
  }
}

