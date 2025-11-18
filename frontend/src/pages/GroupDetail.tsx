import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { groupsApi, GroupWithMembers, UserSearchResult } from '../api/groups'
import { workspaceApi, Project, Task, ProjectWithTasks } from '../api/workspace'
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
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showWorkspaceSettingsModal, setShowWorkspaceSettingsModal] = useState(false)
  
  // Permissions
  const [permissionsData, setPermissionsData] = useState<{
    available_permissions: string[]
    role_permissions: Record<string, Record<string, boolean>>
    current_user_permissions: Record<string, boolean> | null
  } | null>(null)
  const [selectedMemberForPermissions, setSelectedMemberForPermissions] = useState<number | null>(null)
  const [customPermissions, setCustomPermissions] = useState<Record<string, boolean>>({})
  
  // Invite form
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')
  const [searching, setSearching] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'email' | 'wallet'>('email')
  const [walletAddress, setWalletAddress] = useState('')
  const [walletNetwork, setWalletNetwork] = useState<'tron' | 'ethereum'>('tron')
  
  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_public: false,
    required_operating_systems: [] as string[],
    preferred_model_runner: '',
  })
  const [editActiveTab, setEditActiveTab] = useState<'basic' | 'resources' | 'settings'>('basic')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  
  // Workspace settings form
  const [workspaceSettings, setWorkspaceSettings] = useState({
    default_member_role: 'member',
    allow_self_invite: false,
    require_approval: false,
  })
  
  // Projects
  const [_projects, setProjects] = useState<Project[]>([])
  const [_loadingProjects, setLoadingProjects] = useState(false)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active' as const })
  const [selectedProject, setSelectedProject] = useState<ProjectWithTasks | null>(null)
  const [showProjectDetail, setShowProjectDetail] = useState(false)
  
  // Tasks
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ 
    title: '', 
    description: '', 
    status: 'todo' as const, 
    priority: 'medium' as const,
    due_date: ''
  })

  useEffect(() => {
    if (id) {
      fetchGroup()
      fetchProjects()
    }
  }, [id])
  
  const fetchProjects = async () => {
    if (!id) return
    try {
      setLoadingProjects(true)
      const data = await workspaceApi.listProjects(Number(id))
      setProjects(data)
    } catch (err: any) {
      console.error('Failed to load projects:', err)
    } finally {
      setLoadingProjects(false)
    }
  }
  
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    
    try {
      await workspaceApi.createProject(Number(id), projectForm)
      setShowCreateProjectModal(false)
      setProjectForm({ name: '', description: '', status: 'active' })
      fetchProjects()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create project')
    }
  }
  
  const handleViewProject = async (projectId: number) => {
    try {
      const project = await workspaceApi.getProject(projectId)
      setSelectedProject(project)
      setShowProjectDetail(true)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to load project')
    }
  }
  
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    
    try {
      const taskData = {
        ...taskForm,
        due_date: taskForm.due_date || undefined
      }
      await workspaceApi.createTask(selectedProject.id, taskData)
      setShowCreateTaskModal(false)
      setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', due_date: '' })
      handleViewProject(selectedProject.id) // Refresh project
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create task')
    }
  }
  
  const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    if (!selectedProject) return
    
    try {
      await workspaceApi.updateTask(taskId, updates)
      handleViewProject(selectedProject.id) // Refresh project
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update task')
    }
  }

  const fetchGroup = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await groupsApi.getGroup(Number(id))
      setGroup(data)
      setEditForm({
        name: data.name,
        description: data.description || '',
        is_public: data.is_public,
        required_operating_systems: data.required_operating_systems 
          ? data.required_operating_systems.split(',').map((os: string) => os.trim().toLowerCase())
          : [],
        preferred_model_runner: data.preferred_model_runner || '',
      })
      
      // Load workspace settings
      setWorkspaceSettings({
        default_member_role: (data as any).default_member_role || 'member',
        allow_self_invite: (data as any).allow_self_invite || false,
        require_approval: (data as any).require_approval || false,
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
    if (!id) return
    
    try {
      if (inviteMethod === 'email' && selectedUser) {
        await groupsApi.addMember(Number(id), {
          user_id: selectedUser.id,
          role: inviteRole
        })
      } else if (inviteMethod === 'wallet' && walletAddress) {
        await groupsApi.addMember(Number(id), {
          wallet_address: walletAddress,
          wallet_network: walletNetwork,
          role: inviteRole
        })
      } else {
        alert('Please select a user or enter a wallet address')
        return
      }
      
      setShowInviteModal(false)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      setWalletAddress('')
      setWalletNetwork('tron')
      setInviteMethod('email')
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

  const fetchPermissions = async () => {
    if (!id) return
    try {
      const data = await groupsApi.getGroupPermissions(Number(id))
      setPermissionsData(data)
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  const handleUpdateMemberPermissions = async (userId: number) => {
    if (!id) return
    try {
      await groupsApi.updateMemberPermissions(Number(id), userId, customPermissions)
      setShowPermissionsModal(false)
      setSelectedMemberForPermissions(null)
      setCustomPermissions({})
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update permissions')
    }
  }

  const handleEditMemberPermissions = (member: any) => {
    setSelectedMemberForPermissions(member.user_id)
    setCustomPermissions(member.custom_permissions || {})
    setShowPermissionsModal(true)
  }

  const handleSaveWorkspaceSettings = async () => {
    if (!id) return
    
    try {
      await groupsApi.updateWorkspaceSettings(Number(id), workspaceSettings)
      setShowWorkspaceSettingsModal(false)
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update workspace settings')
    }
  }

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!editForm.name.trim()) {
      newErrors.name = 'Group name is required'
    } else if (editForm.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters'
    } else if (editForm.name.length > 100) {
      newErrors.name = 'Group name must be less than 100 characters'
    }
    
    if (editForm.description && editForm.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }
    
    setEditErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleUpdateGroup = async () => {
    if (!id) return
    
    if (!validateEditForm()) {
      return
    }
    
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        is_public: editForm.is_public,
        required_operating_systems: editForm.required_operating_systems.length > 0 
          ? editForm.required_operating_systems.join(',') 
          : undefined,
        preferred_model_runner: editForm.preferred_model_runner || undefined,
      }
      
      await groupsApi.updateGroup(Number(id), payload)
      setShowEditModal(false)
      setEditActiveTab('basic')
      setEditErrors({})
      fetchGroup()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update group')
    }
  }

  const toggleEditOperatingSystem = (os: string) => {
    setEditForm(prev => ({
      ...prev,
      required_operating_systems: prev.required_operating_systems.includes(os)
        ? prev.required_operating_systems.filter(o => o !== os)
        : [...prev.required_operating_systems, os]
    }))
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
  const isViewer = currentMember?.role === 'viewer'
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
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.user_id, e.target.value as any)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              onClick={() => handleEditMemberPermissions(member)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Edit custom permissions"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                              </svg>
                            </button>
                          </div>
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
                {(group as any).required_operating_systems && (
                  <div>
                    <span className="text-gray-600">Required OS:</span>
                    <span className="ml-2 text-gray-900">
                      {(group as any).required_operating_systems.split(',').map((os: string) => 
                        os.trim().charAt(0).toUpperCase() + os.trim().slice(1)
                      ).join(', ')}
                    </span>
                  </div>
                )}
                {(group as any).preferred_model_runner && (
                  <div>
                    <span className="text-gray-600">Model Runner:</span>
                    <span className="ml-2 text-gray-900 capitalize">
                      {(group as any).preferred_model_runner}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Workspace Management */}
            {(isOwner || isAdmin) && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Workspace Management</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      // Load current workspace settings
                      if (group) {
                        setWorkspaceSettings({
                          default_member_role: (group as any).default_member_role || 'member',
                          allow_self_invite: (group as any).allow_self_invite || false,
                          require_approval: (group as any).require_approval || false,
                        })
                      }
                      setShowWorkspaceSettingsModal(true)
                    }}
                    className="w-full btn-secondary text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Workspace Settings</div>
                        <div className="text-sm text-gray-500">Configure workspace preferences</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      fetchPermissions()
                      setShowPermissionsModal(true)
                    }}
                    className="w-full btn-secondary text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Role Permissions</div>
                        <div className="text-sm text-gray-500">Manage role-based permissions</div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            )}

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
            <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite Member</h2>
              
              <div className="space-y-4">
                {/* Invite Method Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteMethod('email')
                      setSelectedUser(null)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      inviteMethod === 'email'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    By Email/Username
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInviteMethod('wallet')
                      setSelectedUser(null)
                      setSearchQuery('')
                      setSearchResults([])
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      inviteMethod === 'wallet'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    By Wallet Address
                  </button>
                </div>

                {inviteMethod === 'email' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search by email, username, or wallet address
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter email, username, or wallet address..."
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
                              {user.wallets && user.wallets.length > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {user.wallets.map(w => w.address).join(', ')}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {selectedUser && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="font-medium text-blue-900">Selected: {selectedUser.username}</div>
                          <div className="text-sm text-blue-700">{selectedUser.email}</div>
                          {selectedUser.wallets && selectedUser.wallets.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              Wallets: {selectedUser.wallets.map(w => `${w.address} (${w.network})`).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wallet Address
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        placeholder="Enter wallet address (e.g., TAVZauYCxsRFgdckgyaWEiTq3cTX7sZe8v)"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The user must have this wallet address verified in their account
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Network
                      </label>
                      <select
                        value={walletNetwork}
                        onChange={(e) => setWalletNetwork(e.target.value as 'tron' | 'ethereum')}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="tron">Tron</option>
                        <option value="ethereum">Ethereum</option>
                      </select>
                    </div>
                  </>
                )}

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
                    setWalletAddress('')
                    setWalletNetwork('tron')
                    setInviteMethod('email')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviteMethod === 'email' ? !selectedUser : !walletAddress}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Edit Group Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Group</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditActiveTab('basic')
                    setEditErrors({})
                    // Reset form to current group data
                    if (group) {
                      setEditForm({
                        name: group.name,
                        description: group.description || '',
                        is_public: group.is_public,
                        required_operating_systems: (group as any).required_operating_systems 
                          ? (group as any).required_operating_systems.split(',').map((os: string) => os.trim().toLowerCase())
                          : [],
                        preferred_model_runner: (group as any).preferred_model_runner || '',
                      })
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditActiveTab('basic')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    editActiveTab === 'basic'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setEditActiveTab('resources')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    editActiveTab === 'resources'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Resource Requirements
                </button>
                <button
                  type="button"
                  onClick={() => setEditActiveTab('settings')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    editActiveTab === 'settings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info Tab */}
                {editActiveTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                          editErrors.name ? 'border-red-300' : 'border-gray-200'
                        }`}
                        value={editForm.name}
                        onChange={(e) => {
                          setEditForm({ ...editForm, name: e.target.value })
                          if (editErrors.name) setEditErrors({ ...editErrors, name: '' })
                        }}
                        maxLength={100}
                      />
                      {editErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {editForm.name.length}/100 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                          editErrors.description ? 'border-red-300' : 'border-gray-200'
                        }`}
                        rows={4}
                        placeholder="Describe your group's purpose, goals, and what members can expect..."
                        value={editForm.description}
                        onChange={(e) => {
                          setEditForm({ ...editForm, description: e.target.value })
                          if (editErrors.description) setEditErrors({ ...editErrors, description: '' })
                        }}
                        maxLength={1000}
                      />
                      {editErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{editErrors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {editForm.description.length}/1000 characters
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="edit_is_public"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                          checked={editForm.is_public}
                          onChange={(e) => setEditForm({ ...editForm, is_public: e.target.checked })}
                        />
                        <div className="ml-3">
                          <label htmlFor="edit_is_public" className="block text-sm font-medium text-gray-900">
                            Make this group public
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Public groups are visible to everyone and can be discovered in the marketplace. 
                            Private groups are only accessible to invited members.
                          </p>
                          {editForm.is_public && (
                            <p className="text-xs text-blue-700 mt-2 font-medium">
                              ⚠️ Note: Public groups can be joined by anyone. Models in public groups are not automatically encrypted.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resource Requirements Tab */}
                {editActiveTab === 'resources' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Required Operating Systems
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Select which operating systems nodes must have to run this group's models. 
                        Leave empty to allow any OS.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['windows', 'linux', 'macos'].map((os) => (
                          <button
                            key={os}
                            type="button"
                            onClick={() => toggleEditOperatingSystem(os)}
                            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                              editForm.required_operating_systems.includes(os)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {os.charAt(0).toUpperCase() + os.slice(1)}
                            {editForm.required_operating_systems.includes(os) && (
                              <span className="ml-2">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {editForm.required_operating_systems.length > 0 && (
                        <p className="mt-2 text-xs text-gray-600">
                          Selected: {editForm.required_operating_systems.map(os => os.charAt(0).toUpperCase() + os.slice(1)).join(', ')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Model Runner
                      </label>
                      <p className="text-xs text-gray-500 mb-3">
                        Optionally specify a preferred model runner for this group's models.
                      </p>
                      <select
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        value={editForm.preferred_model_runner}
                        onChange={(e) => setEditForm({ ...editForm, preferred_model_runner: e.target.value })}
                      >
                        <option value="">Any (No preference)</option>
                        <option value="ollama">Ollama</option>
                        <option value="llm">LLM</option>
                        <option value="transformers">Transformers</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">💡 Resource Requirements Info</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• These settings help match your group's models with compatible nodes</li>
                        <li>• Nodes must meet these requirements to run jobs for this group</li>
                        <li>• Changes will affect future job assignments</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {editActiveTab === 'settings' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Group Summary</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium text-gray-900">{editForm.name || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Visibility:</span>
                          <span className="font-medium text-gray-900">
                            {editForm.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Required OS:</span>
                          <span className="font-medium text-gray-900">
                            {editForm.required_operating_systems.length > 0
                              ? editForm.required_operating_systems.map(os => os.charAt(0).toUpperCase() + os.slice(1)).join(', ')
                              : 'Any'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Model Runner:</span>
                          <span className="font-medium text-gray-900">
                            {editForm.preferred_model_runner || 'Any'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">⚙️ Additional Settings</h4>
                      <p className="text-xs text-yellow-800">
                        Member permissions, invitation policies, and other advanced settings can be managed 
                        from the group management section.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    {editActiveTab !== 'basic' && (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs: ('basic' | 'resources' | 'settings')[] = ['basic', 'resources', 'settings']
                          const currentIndex = tabs.indexOf(editActiveTab)
                          if (currentIndex > 0) {
                            setEditActiveTab(tabs[currentIndex - 1])
                          }
                        }}
                        className="btn-secondary"
                      >
                        ← Previous
                      </button>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false)
                        setEditActiveTab('basic')
                        setEditErrors({})
                        // Reset form to current group data
                        if (group) {
                          setEditForm({
                            name: group.name,
                            description: group.description || '',
                            is_public: group.is_public,
                            required_operating_systems: (group as any).required_operating_systems 
                              ? (group as any).required_operating_systems.split(',').map((os: string) => os.trim().toLowerCase())
                              : [],
                            preferred_model_runner: (group as any).preferred_model_runner || '',
                          })
                        }
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    {editActiveTab !== 'settings' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs: ('basic' | 'resources' | 'settings')[] = ['basic', 'resources', 'settings']
                          const currentIndex = tabs.indexOf(editActiveTab)
                          if (currentIndex < tabs.length - 1) {
                            setEditActiveTab(tabs[currentIndex + 1])
                          }
                        }}
                        className="btn-primary"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleUpdateGroup}
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Management Modal */}
        {showPermissionsModal && permissionsData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="card p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Role Permissions Management</h2>
                <button
                  onClick={() => {
                    setShowPermissionsModal(false)
                    setSelectedMemberForPermissions(null)
                    setCustomPermissions({})
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedMemberForPermissions ? (
                // Edit specific member permissions
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Custom Permissions Override</h3>
                    <p className="text-sm text-blue-800">
                      Override default role permissions for this specific member. Leave unchecked to use role defaults.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {permissionsData.available_permissions.map((permission) => {
                      const member = group?.members.find(m => m.user_id === selectedMemberForPermissions)
                      const roleDefault = member?.role 
                        ? permissionsData.role_permissions[member.role]?.[permission] ?? false
                        : false
                      const customValue = customPermissions[permission]
                      const effectiveValue = customValue !== undefined ? customValue : roleDefault
                      
                      return (
                        <div key={permission} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-900 mb-1">
                              {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </label>
                            <p className="text-xs text-gray-500">
                              Role default: {roleDefault ? '✓ Allowed' : '✗ Denied'}
                              {customValue !== undefined && (
                                <span className="ml-2 text-blue-600">
                                  (Custom: {customValue ? '✓ Allowed' : '✗ Denied'})
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (customValue === undefined) {
                                  setCustomPermissions({ ...customPermissions, [permission]: !roleDefault })
                                } else if (customValue === roleDefault) {
                                  const newPerms = { ...customPermissions }
                                  delete newPerms[permission]
                                  setCustomPermissions(newPerms)
                                } else {
                                  setCustomPermissions({ ...customPermissions, [permission]: !customValue })
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                effectiveValue
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {effectiveValue ? '✓ Allowed' : '✗ Denied'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedMemberForPermissions(null)
                        setCustomPermissions({})
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateMemberPermissions(selectedMemberForPermissions)}
                      className="btn-primary"
                    >
                      Save Permissions
                    </button>
                  </div>
                </div>
              ) : (
                // View role permissions
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(permissionsData.role_permissions).map(([role, permissions]) => (
                      <div key={role} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 capitalize">{role} Permissions</h3>
                        <div className="space-y-2">
                          {Object.entries(permissions).slice(0, 6).map(([perm, allowed]) => (
                            <div key={perm} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{perm.replace(/_/g, ' ')}</span>
                              <span className={allowed ? 'text-green-600' : 'text-gray-400'}>
                                {allowed ? '✓' : '✗'}
                              </span>
                            </div>
                          ))}
                          {Object.keys(permissions).length > 6 && (
                            <p className="text-xs text-gray-500 mt-2">
                              +{Object.keys(permissions).length - 6} more permissions
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Member Custom Permissions</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      You can override permissions for individual members. Click on a member in the members list to customize their permissions.
                    </p>
                    <div className="space-y-2">
                      {group?.members.filter(m => m.custom_permissions && Object.keys(m.custom_permissions).length > 0).map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-900">
                            {member.user_username || member.user_email || `User ${member.user_id}`}
                          </span>
                          <button
                            onClick={() => handleEditMemberPermissions(member)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Edit Permissions
                          </button>
                        </div>
                      ))}
                      {group?.members.filter(m => m.custom_permissions && Object.keys(m.custom_permissions).length > 0).length === 0 && (
                        <p className="text-sm text-gray-500">No custom permissions set</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowPermissionsModal(false)
                        setSelectedMemberForPermissions(null)
                        setCustomPermissions({})
                      }}
                      className="btn-secondary"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Workspace Settings Modal */}
        {showWorkspaceSettingsModal && group && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="card p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Workspace Settings</h2>
                <button
                  onClick={() => setShowWorkspaceSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Member Role
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    value={workspaceSettings.default_member_role}
                    onChange={(e) => {
                      setWorkspaceSettings({ ...workspaceSettings, default_member_role: e.target.value })
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    New members will be assigned this role by default
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="allow_self_invite"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      checked={workspaceSettings.allow_self_invite}
                      onChange={(e) => {
                        setWorkspaceSettings({ ...workspaceSettings, allow_self_invite: e.target.checked })
                      }}
                    />
                    <div className="ml-3">
                      <label htmlFor="allow_self_invite" className="block text-sm font-medium text-gray-900">
                        Allow Members to Invite Others
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        When enabled, members can invite new users to the workspace
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="require_approval"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      checked={workspaceSettings.require_approval}
                      onChange={(e) => {
                        setWorkspaceSettings({ ...workspaceSettings, require_approval: e.target.checked })
                      }}
                    />
                    <div className="ml-3">
                      <label htmlFor="require_approval" className="block text-sm font-medium text-gray-900">
                        Require Approval for New Members
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        When enabled, new member requests must be approved by an admin or owner
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">⚙️ Advanced Settings</h4>
                  <p className="text-xs text-yellow-800">
                    Additional workspace configuration options will be available in future updates.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowWorkspaceSettingsModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveWorkspaceSettings}
                    className="btn-primary"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Project</h2>
                <button
                  onClick={() => setShowCreateProjectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    placeholder="Enter project description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value as any })}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateProjectModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Project Detail Modal */}
        {showProjectDetail && selectedProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="card p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h2>
                  {selectedProject.description && (
                    <p className="text-gray-600 mt-1">{selectedProject.description}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowProjectDetail(false)
                    setSelectedProject(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tasks ({selectedProject.tasks.length})
                  </h3>
                  {!isViewer && (
                    <button
                      onClick={() => setShowCreateTaskModal(true)}
                      className="btn-primary"
                    >
                      <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Task
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {selectedProject.tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No tasks yet. Create your first task!</p>
                    </div>
                  ) : (
                    selectedProject.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-medium text-gray-900">{task.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.status === 'done' ? 'bg-green-100 text-green-800' :
                                task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                task.status === 'blocked' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            {task.due_date && (
                              <p className="text-xs text-gray-500">
                                Due: {new Date(task.due_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {!isViewer && (
                            <div className="flex items-center gap-2">
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTask(task.id, { status: e.target.value as any })}
                                className="text-xs px-2 py-1 border border-gray-300 rounded"
                              >
                                <option value="todo">Todo</option>
                                <option value="in_progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Create Task Modal */}
        {showCreateTaskModal && selectedProject && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create Task</h2>
                <button
                  onClick={() => setShowCreateTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Enter task title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Enter task description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                    >
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (optional)</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTaskModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
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
