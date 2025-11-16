import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'

interface Model {
  id: number
  name: string
  description?: string
  version: string
  ipfs_cid?: string
  ipfs_gateway_url?: string
  file_size?: number
  file_format?: string
  license: string
  created_at: string
  owner_id: number
}

export default function Models() {
  const { groupId } = useParams<{ groupId: string }>()
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  // const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (groupId) {
      fetchModels()
    }
  }, [groupId])

  const fetchModels = async () => {
    try {
      const response = await api.get(`/models/groups/${groupId}/models`)
      setModels(response.data)
    } catch (error) {
      console.error('Failed to fetch models:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Models</h1>
        <Link
          to={`/groups/${groupId}/models/upload`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Upload Model
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((model) => (
          <Link
            key={model.id}
            to={`/groups/${groupId}/models/${model.id}`}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{model.name}</h2>
            <p className="text-gray-600 mb-2 text-sm">{model.description || 'No description'}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                v{model.version}
              </span>
              {model.file_format && (
                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                  {model.file_format}
                </span>
              )}
              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                {formatFileSize(model.file_size)}
              </span>
              {model.ipfs_cid && (
                <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                  IPFS
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {models.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No models yet. Upload your first model to get started!</p>
        </div>
      )}
    </div>
  )
}

