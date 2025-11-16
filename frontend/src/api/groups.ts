import api from './client'

export interface Group {
  id: number
  name: string
  description?: string
  owner_id: number
  is_public: boolean
  created_at: string
  updated_at?: string
}

export interface GroupMember {
  id: number
  group_id: number
  user_id: number
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joined_at: string
}

export interface GroupWithMembers extends Group {
  members: GroupMember[]
}

export interface UserSearchResult {
  id: number
  email: string
  username: string
  full_name?: string
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
  updateGroup: async (groupId: number, data: { name: string; description?: string; is_public: boolean }) => {
    const response = await api.put<Group>(`/groups/${groupId}`, data)
    return response.data
  },

  // Delete group
  deleteGroup: async (groupId: number) => {
    await api.delete(`/groups/${groupId}`)
  },

  // Add member
  addMember: async (groupId: number, userId: number, role: 'admin' | 'member' | 'viewer' = 'member') => {
    const response = await api.post<GroupMember>(`/groups/${groupId}/members`, {
      user_id: userId,
      role
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
  }
}

