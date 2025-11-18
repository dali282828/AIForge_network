import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

interface Group {
  id: number
  name: string
  description?: string
  owner_id: number
  is_public: boolean
  group_type: 'both' | 'training' | 'inference'
  required_operating_systems?: string
  preferred_model_runner?: string
  created_at: string
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    group_type: 'both' as 'both' | 'training' | 'inference',
    required_operating_systems: [] as string[],
    preferred_model_runner: '',
  })
  const [activeTab, setActiveTab] = useState<'basic' | 'resources' | 'settings'>('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filterType, setFilterType] = useState<'all' | 'both' | 'training' | 'inference'>('all')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups')
      setGroups(response.data || [])
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required'
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Group name must be less than 100 characters'
    }
    
    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        is_public: formData.is_public,
        group_type: formData.group_type,
        required_operating_systems: formData.required_operating_systems.length > 0 
          ? formData.required_operating_systems.join(',') 
          : undefined,
        preferred_model_runner: formData.preferred_model_runner || undefined,
      }
      
      const response = await api.post('/groups', payload)
      setGroups([...groups, response.data])
      setShowCreateModal(false)
      setFormData({ 
        name: '', 
        description: '', 
        is_public: false,
        group_type: 'both',
        required_operating_systems: [],
        preferred_model_runner: '',
      })
      setActiveTab('basic')
      setErrors({})
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create group')
    }
  }

  const toggleOperatingSystem = (os: string) => {
    setFormData(prev => ({
      ...prev,
      required_operating_systems: prev.required_operating_systems.includes(os)
        ? prev.required_operating_systems.filter(o => o !== os)
        : [...prev.required_operating_systems, os]
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Groups
            </h1>
            <p className="text-gray-600 text-lg">Collaborate on AI models and projects</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <span className="mr-2">+</span>
            Create Group
          </button>
        </div>

        {/* Enhanced Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ 
                      name: '', 
                      description: '', 
                      is_public: false,
                      group_type: 'both',
                      required_operating_systems: [],
                      preferred_model_runner: '',
                    })
                    setActiveTab('basic')
                    setErrors({})
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
                  onClick={() => setActiveTab('basic')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('resources')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'resources'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Resource Requirements
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Settings
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Group Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                          errors.name ? 'border-red-300' : 'border-gray-200'
                        }`}
                        placeholder="My Awesome Group"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: '' })
                        }}
                        maxLength={100}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.name.length}/100 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${
                          errors.description ? 'border-red-300' : 'border-gray-200'
                        }`}
                        rows={4}
                        placeholder="Describe your group's purpose, goals, and what members can expect..."
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value })
                          if (errors.description) setErrors({ ...errors, description: '' })
                        }}
                        maxLength={1000}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.description.length}/1000 characters
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Group Type *</label>
                      <p className="text-xs text-gray-500 mb-3">
                        Choose the primary focus of this group. This helps organize and filter groups.
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, group_type: 'both' })}
                          className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                            formData.group_type === 'both'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="font-semibold mb-1">Both</div>
                          <div className="text-xs opacity-75">Training & Inference</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, group_type: 'training' })}
                          className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                            formData.group_type === 'training'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="font-semibold mb-1">Training</div>
                          <div className="text-xs opacity-75">Model Training Focus</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, group_type: 'inference' })}
                          className={`px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all ${
                            formData.group_type === 'inference'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <div className="font-semibold mb-1">Inference</div>
                          <div className="text-xs opacity-75">Model Serving Focus</div>
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="is_public"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                          checked={formData.is_public}
                          onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                        />
                        <div className="ml-3">
                          <label htmlFor="is_public" className="block text-sm font-medium text-gray-900">
                            Make this group public
                          </label>
                          <p className="text-xs text-gray-600 mt-1">
                            Public groups are visible to everyone and can be discovered in the marketplace. 
                            Private groups are only accessible to invited members.
                          </p>
                          {formData.is_public && (
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
                {activeTab === 'resources' && (
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
                            onClick={() => toggleOperatingSystem(os)}
                            className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                              formData.required_operating_systems.includes(os)
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {os.charAt(0).toUpperCase() + os.slice(1)}
                            {formData.required_operating_systems.includes(os) && (
                              <span className="ml-2">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                      {formData.required_operating_systems.length > 0 && (
                        <p className="mt-2 text-xs text-gray-600">
                          Selected: {formData.required_operating_systems.map(os => os.charAt(0).toUpperCase() + os.slice(1)).join(', ')}
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
                        value={formData.preferred_model_runner}
                        onChange={(e) => setFormData({ ...formData, preferred_model_runner: e.target.value })}
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
                        <li>• You can change these settings later in group settings</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">⚙️ Advanced Settings</h4>
                      <p className="text-xs text-yellow-800">
                        Additional settings like member permissions, invitation policies, and resource limits 
                        can be configured after creating the group in the group settings page.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Group Summary</h4>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium text-gray-900">{formData.name || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Visibility:</span>
                            <span className="font-medium text-gray-900">
                              {formData.is_public ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Group Type:</span>
                            <span className="font-medium text-gray-900">
                              {formData.group_type === 'both' ? 'Training & Inference' :
                               formData.group_type === 'training' ? 'Training' : 'Inference'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Required OS:</span>
                            <span className="font-medium text-gray-900">
                              {formData.required_operating_systems.length > 0
                                ? formData.required_operating_systems.map(os => os.charAt(0).toUpperCase() + os.slice(1)).join(', ')
                                : 'Any'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Model Runner:</span>
                            <span className="font-medium text-gray-900">
                              {formData.preferred_model_runner || 'Any'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    {activeTab !== 'basic' && (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs: ('basic' | 'resources' | 'settings')[] = ['basic', 'resources', 'settings']
                          const currentIndex = tabs.indexOf(activeTab)
                          if (currentIndex > 0) {
                            setActiveTab(tabs[currentIndex - 1])
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
                        setShowCreateModal(false)
                        setFormData({ 
                          name: '', 
                          description: '', 
                          is_public: false,
                          group_type: 'both',
                          required_operating_systems: [],
                          preferred_model_runner: '',
                        })
                        setActiveTab('basic')
                        setErrors({})
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    {activeTab !== 'settings' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs: ('basic' | 'resources' | 'settings')[] = ['basic', 'resources', 'settings']
                          const currentIndex = tabs.indexOf(activeTab)
                          if (currentIndex < tabs.length - 1) {
                            setActiveTab(tabs[currentIndex + 1])
                          }
                        }}
                        className="btn-primary"
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn-primary"
                      >
                        Create Group
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filter by Group Type */}
        {!loading && groups.length > 0 && (
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Groups
            </button>
            <button
              onClick={() => setFilterType('both')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'both'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Both
            </button>
            <button
              onClick={() => setFilterType('training')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'training'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Training
            </button>
            <button
              onClick={() => setFilterType('inference')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'inference'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inference
            </button>
          </div>
        )}

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (() => {
          const filteredGroups = filterType === 'all' 
            ? groups 
            : groups.filter(g => g.group_type === filterType)
          
          return filteredGroups.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filterType === 'all' ? 'No groups yet' : `No ${filterType} groups`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filterType === 'all' 
                  ? 'Create your first group to start collaborating!'
                  : `No groups with type "${filterType}" found. Try a different filter or create a new group.`}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="card-hover p-6 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">👥</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`badge ${group.is_public ? 'badge-success' : 'bg-gray-100 text-gray-600'}`}>
                      {group.is_public ? 'Public' : 'Private'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      group.group_type === 'both' ? 'bg-blue-100 text-blue-800' :
                      group.group_type === 'training' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {group.group_type === 'both' ? 'Training & Inference' :
                       group.group_type === 'training' ? 'Training' : 'Inference'}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {group.name}
                </h2>
                <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                  {group.description || 'No description'}
                </p>
                
                {/* Resource Requirements */}
                {((group as any).required_operating_systems || (group as any).preferred_model_runner) && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(group as any).required_operating_systems && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                        OS: {(group as any).required_operating_systems.split(',').map((os: string) => os.trim().charAt(0).toUpperCase() + os.trim().slice(1)).join(', ')}
                      </span>
                    )}
                    {(group as any).preferred_model_runner && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-50 text-purple-700 rounded-full">
                        {(group as any).preferred_model_runner.charAt(0).toUpperCase() + (group as any).preferred_model_runner.slice(1)}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500">
                  <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                  <svg className="ml-auto h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
