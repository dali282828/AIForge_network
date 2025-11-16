import { useState, useEffect } from 'react'
import api from '../api/client'

interface PublishedModel {
  id: number
  name: string
  description?: string
  version?: string
  group_id: number
  group_name?: string
  group_is_public?: boolean
  owner_id: number
  tags?: string
  created_at?: string
  license?: string
}

interface ModelDiscoveryProps {
  isOpen: boolean
  onClose: () => void
  onSelectModel: (modelId: number | null) => void
  selectedModelId?: number | null
}

export default function ModelDiscovery({ isOpen, onClose, onSelectModel, selectedModelId }: ModelDiscoveryProps) {
  const [models, setModels] = useState<PublishedModel[]>([])
  const [filteredModels, setFilteredModels] = useState<PublishedModel[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest')
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      loadModels()
    }
  }, [isOpen])

  useEffect(() => {
    filterAndSortModels()
  }, [models, searchQuery, selectedGroup, sortBy])

  const loadModels = async () => {
    setLoading(true)
    try {
      const response = await api.get('/models/published')
      const modelsData = response.data || []
      setModels(modelsData)
      
      // Extract unique groups
      const uniqueGroups = [...new Set(modelsData.map((m: PublishedModel) => m.group_name).filter(Boolean))]
      setGroups(uniqueGroups as string[])
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortModels = () => {
    let filtered = [...models]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(query) ||
          model.description?.toLowerCase().includes(query) ||
          model.group_name?.toLowerCase().includes(query) ||
          model.tags?.toLowerCase().includes(query)
      )
    }

    // Filter by group
    if (selectedGroup) {
      filtered = filtered.filter((model) => model.group_name === selectedGroup)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      } else if (sortBy === 'newest') {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      }
      return 0
    })

    setFilteredModels(filtered)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Discover Models</h2>
              <p className="text-sm text-gray-500 mt-1">
                Explore models from communities and groups
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search models, groups, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Group Filter */}
              <div className="md:w-48">
                <select
                  value={selectedGroup || ''}
                  onChange={(e) => setSelectedGroup(e.target.value || null)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">All Groups</option>
                  {groups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="md:w-40">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
              <span>
                <span className="font-semibold text-gray-900">{filteredModels.length}</span> models
              </span>
              {selectedGroup && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Filtered by: <span className="font-semibold">{selectedGroup}</span>
                </span>
              )}
            </div>
          </div>

          {/* Models Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredModels.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No models found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchQuery || selectedGroup
                    ? 'Try adjusting your search or filters'
                    : 'Models will appear here when groups publish them'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Default Option */}
                <button
                  onClick={() => {
                    onSelectModel(null)
                    onClose()
                  }}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    !selectedModelId
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                      <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    {!selectedModelId && (
                      <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Default Model</h3>
                  <p className="text-sm text-gray-500">
                    Use the platform's default model selection
                  </p>
                </button>

                {/* Model Cards */}
                {filteredModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onSelectModel(model.id)
                      onClose()
                    }}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedModelId === model.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md bg-white'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      {selectedModelId === model.id && (
                        <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>

                    {/* Model Name */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {model.name}
                    </h3>

                    {/* Group Badge */}
                    {model.group_name && (
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{model.group_name}</span>
                        {model.group_is_public && (
                          <span className="px-1.5 py-0.5 text-xs text-green-700 bg-green-100 rounded">
                            Public
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {model.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {model.description}
                      </p>
                    )}

                    {/* Tags */}
                    {model.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {model.tags.split(',').slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {model.version && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            v{model.version}
                          </span>
                        )}
                        {model.license && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            {model.license}
                          </span>
                        )}
                      </div>
                      <svg
                        className={`h-5 w-5 transition-colors ${
                          selectedModelId === model.id ? 'text-blue-600' : 'text-gray-400'
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Select a model to start chatting, or choose "Default Model" for automatic selection
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

