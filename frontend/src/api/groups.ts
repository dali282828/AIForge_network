import api from './client'

export interface Group {
  id: number
  name: string
  description?: string
  owner_id: number
  is_public: boolean
  group_type: 'both' | 'training' | 'inference'
  required_operating_systems?: string
  preferred_model_runner?: string
  default_member_role?: string
  allow_self_invite?: boolean
  require_approval?: boolean
  workspace_settings?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface GroupMember {
  id: number
  group_id: number
  user_id: number
  role: 'owner' | 'admin' | 'member' | 'viewer'
  permissions?: Record<string, boolean>
  custom_permissions?: Record<string, boolean>
  joined_at: string
  user_email?: string
  user_username?: string
  user_full_name?: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface UserSearchResult {
  id: number
  email: string
  username: string
  full_name?: string
  wallets?: Array<{
    address: string
    network: string
  }>
}

export const groupsApi = {
  // Get all groups
  getGroups: async () => {
    const response = await api.get<Group[]>('/groups')
    return response.data
  },

  // Get group details
  getGroup: async (groupId: number) => {
    const response = await api.get<GroupWithMembers>(`/groups/${groupId}`)
    return response.data
  },

  // Create group
  createGroup: async (data: { name: string; description?: string; is_public: boolean }) => {
    const response = await api.post<Group>('/groups', data)
    return response.data
  },

  // Update group
  updateGroup: async (groupId: number, data: { 
    name: string
    description?: string
    is_public: boolean
    required_operating_systems?: string
    preferred_model_runner?: string
    default_member_role?: string
    allow_self_invite?: boolean
    require_approval?: boolean
    workspace_settings?: Record<string, any>
  }) => {
    const response = await api.put<Group>(`/groups/${groupId}`, data)
    return response.data
  },

  // Update workspace settings
  updateWorkspaceSettings: async (groupId: number, settings: {
    default_member_role?: string
    allow_self_invite?: boolean
    require_approval?: boolean
    workspace_settings?: Record<string, any>
  }) => {
    const response = await api.patch<Group>(`/groups/${groupId}/workspace-settings`, settings)
    return response.data
  },

  // Delete group
  deleteGroup: async (groupId: number) => {
    await api.delete(`/groups/${groupId}`)
  },

  // Add member (by user_id or wallet_address)
  addMember: async (
    groupId: number, 
    data: {
      user_id?: number
      wallet_address?: string
      wallet_network?: string
      role?: 'admin' | 'member' | 'viewer'
    }
  ) => {
    const response = await api.post<GroupMember>(`/groups/${groupId}/members`, {
      user_id: data.user_id,
      wallet_address: data.wallet_address,
      wallet_network: data.wallet_network,
      role: data.role || 'member'
    })
    return response.data
  },

  // Remove member
  removeMember: async (groupId: number, userId: number) => {
    await api.delete(`/groups/${groupId}/members/${userId}`)
  },

  // Update member role
  updateMemberRole: async (groupId: number, userId: number, role: 'admin' | 'member' | 'viewer') => {
    const response = await api.patch<GroupMember>(`/groups/${groupId}/members/${userId}/role`, null, {
      params: { new_role: role }
    })
    return response.data
  },

  // Transfer ownership
  transferOwnership: async (groupId: number, newOwnerId: number) => {
    const response = await api.post<Group>(`/groups/${groupId}/transfer-ownership?new_owner_id=${newOwnerId}`)
    return response.data
  },

  // Leave group
  leaveGroup: async (groupId: number) => {
    await api.post(`/groups/${groupId}/leave`)
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await api.get<UserSearchResult[]>('/groups/search/users', {
      params: { query, limit: 10 }
    })
    return response.data
  },

  // Get group permissions
  getGroupPermissions: async (groupId: number) => {
    const response = await api.get<{
      available_permissions: string[]
      role_permissions: Record<string, Record<string, boolean>>
      current_user_permissions: Record<string, boolean> | null
    }>(`/groups/${groupId}/permissions`)
    return response.data
  },

  // Update member permissions
  updateMemberPermissions: async (groupId: number, userId: number, permissions: Record<string, boolean>) => {
    const response = await api.patch<{
      id: number
      user_id: number
      role: string
      permissions: Record<string, boolean>
      custom_permissions: Record<string, boolean> | null
    }>(`/groups/${groupId}/members/${userId}/permissions`, permissions)
    return response.data
  }
}

