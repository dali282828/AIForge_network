import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { groupsApi, GroupWithMembers, UserSearchResult } from '../api/groups'
import { useAuthStore } from '../store/authStore'

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [group, setGroup] = useState<GroupWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  
  // Invite form
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [searching, setSearching] = useState(false)
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: false
  })

  useEffect(() => {
    if (id) {
      fetchGroup()
    }
  }, [id])

  const fetchGroup = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await groupsApi.getGroup(Number(id))
      setGroup(data)
      setEditForm({
        name: data.name,
        description: data.description || '',
        is_public: data.is_public
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      setSearching(true)
      const results = await groupsApi.searchUsers(query)
      // Filter out users who are already members
      const memberIds = new Set(group?.members.map(m => m.user_id) || [])
      setSearchResults(results.filter(u => !memberIds.has(u.id)))
    } catch (err: any) {
      console.error('Search failed:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async () => {
    if (!selectedUser || !id) return
    
    try {
      await groupsApi.addMember(Number(id), selectedUser.id, inviteRole)
      setShowInviteModal(false)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to invite member')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!id) return
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      await groupsApi.removeMember(Number(id), userId)
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove member')
    }
  }

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'member' | 'viewer') => {
    if (!id) return
    
    try {
      await groupsApi.updateMemberRole(Number(id), userId, newRole)
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update role')
    }
  }

  const handleUpdateGroup = async () => {
    if (!id) return
    
    try {
      await groupsApi.updateGroup(Number(id), editForm)
      setShowEditModal(false)
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update group')
    }
  }

  const handleDeleteGroup = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return
    
    try {
      await groupsApi.deleteGroup(Number(id))
      navigate('/groups')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete group')
    }
  }

  const handleTransferOwnership = async (newOwnerId: number) => {
    if (!id) return
    if (!confirm('Are you sure you want to transfer ownership? You will become an admin.')) return
    
    try {
      await groupsApi.transferOwnership(Number(id), newOwnerId)
      setShowTransferModal(false)
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to transfer ownership')
    }
  }

  const handleLeaveGroup = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to leave this group?')) return
    
    try {
      await groupsApi.leaveGroup(Number(id))
      navigate('/groups')
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave group')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h2>
          <Link to="/groups" className="text-blue-600 hover:text-blue-800">← Back to Groups</Link>
        </div>
      </div>
    )
  }

  const isOwner = group.owner_id === user?.id
  const currentMember = group.members.find(m => m.user_id === user?.id)
  const isAdmin = currentMember?.role === 'admin' || isOwner
  const canManage = isOwner || isAdmin

  const getRoleBadge = (role: string) => {
    const colors: { [key: string]: string } = {
      owner: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/groups" className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Groups
          </Link>
          
          <div className="flex justify-between items-start mt-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {group.name}
                </h1>
                <span className={`badge ${group.is_public ? 'badge-success' : 'bg-gray-100 text-gray-600'}`}>
                  {group.is_public ? 'Public' : 'Private'}
                </span>
                {isOwner && (
                  <span className="badge bg-purple-100 text-purple-800 border-purple-200">
                    Owner
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">{group.description || 'No description'}</p>
            </div>
            
            {canManage && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="btn-secondary"
                >
                  Edit Group
                </button>
                {isOwner && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Group
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Members Section */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Members ({group.members.length})
                </h2>
                {canManage && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary"
                  >
                    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Invite Member
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {group.members.map((member) => {
                  const isCurrentUser = member.user_id === user?.id
                  const canEdit = isOwner && member.role !== 'owner'
                  const canRemove = (isOwner || isAdmin) && member.role !== 'owner' && !isCurrentUser
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {member.user_id}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {(member as any).user_username || (member as any).user_email || `User ${member.user_id}`}
                            {isCurrentUser && <span className="text-gray-500 ml-2">(You)</span>}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(member as any).user_email && (member as any).user_email !== (member as any).user_username && (
                              <div>{(member as any).user_email}</div>
                            )}
                            <div>Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {canEdit ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`badge ${getRoleBadge(member.role)}`}>
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </span>
                        )}
                        
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove member"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/groups/${id}/models`}
                  className="block w-full btn-primary text-center"
                >
                  View Models
                </Link>
                <Link
                  to={`/groups/${id}/models/upload`}
                  className="block w-full btn-secondary text-center"
                >
                  Upload Model
                </Link>
              </div>
            </div>

            {/* Group Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 text-gray-900">{new Date(group.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Members:</span>
                  <span className="ml-2 text-gray-900">{group.members.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Visibility:</span>
                  <span className="ml-2 text-gray-900">{group.is_public ? 'Public' : 'Private'}</span>
                </div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="block w-full btn-secondary text-center"
                  >
                    Transfer Ownership
                  </button>
                </div>
              </div>
            )}

            {/* Leave Group */}
            {!isOwner && currentMember && (
              <div className="card p-6">
                <button
                  onClick={handleLeaveGroup}
                  className="block w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-center"
                >
                  Leave Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invite Member Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Member</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search by email or username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email or username..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        handleSearchUsers(e.target.value)
                      }}
                    />
                    {searching && (
                      <div className="absolute right-3 top-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedUser(user)
                            setSearchQuery(user.email)
                            setSearchResults([])
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-900">Selected: {selectedUser.username}</div>
                      <div className="text-sm text-blue-700">{selectedUser.email}</div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setSelectedUser(null)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!selectedUser}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Group</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={editForm.is_public}
                    onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700">
                    Make this group public
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateGroup}
                  className="btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Group Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Group</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this group? This action cannot be undone. All models and data associated with this group will be affected.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transfer Ownership Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Transfer Ownership</h2>
              <p className="text-gray-600 mb-4">
                Select a member to transfer ownership to. You will become an admin.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {group.members
                  .filter(m => m.user_id !== user?.id && m.role !== 'owner')
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => handleTransferOwnership(member.user_id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">User {member.user_id}</div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </button>
                  ))}
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn-secondary w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
