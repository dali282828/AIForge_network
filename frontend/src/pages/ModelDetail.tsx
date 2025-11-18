import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api/client'
import { experimentsApi, Experiment, ModelVersion, InferenceTest } from '../api/experiments'

interface Model {
  id: number
  name: string
  description?: string
  version: string
  ipfs_cid?: string
  ipfs_gateway_url?: string
  minio_path?: string
  file_size?: number
  file_format?: string
  license: string
  license_text?: string
  tags?: string
  is_encrypted: boolean
  source?: string
  source_url?: string
  created_at: string
  updated_at?: string
  owner_id: number
  group_id: number
}

export default function ModelDetail() {
  const { groupId, modelId } = useParams<{ groupId: string; modelId: string }>()
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [activeTab, _setActiveTab] = useState<'overview' | 'experiments' | 'versions' | 'tests'>('overview')
  
  // Experiments (reserved for future use)
  const [_experiments, setExperiments] = useState<Experiment[]>([])
  const [_loadingExperiments, setLoadingExperiments] = useState(false)
  
  // Versions (reserved for future use)
  const [_versions, setVersions] = useState<ModelVersion[]>([])
  const [_loadingVersions, setLoadingVersions] = useState(false)
  
  // Tests (reserved for future use)
  const [_tests, setTests] = useState<InferenceTest[]>([])
  const [_loadingTests, setLoadingTests] = useState(false)

  useEffect(() => {
    if (modelId) {
      fetchModel()
      if (activeTab === 'experiments') fetchExperiments()
      if (activeTab === 'versions') fetchVersions()
      if (activeTab === 'tests') fetchTests()
    }
  }, [modelId, activeTab])
  
  const fetchExperiments = async () => {
    if (!modelId) return
    try {
      setLoadingExperiments(true)
      const data = await experimentsApi.listExperiments(Number(modelId))
      setExperiments(data)
    } catch (err: any) {
      console.error('Failed to load experiments:', err)
    } finally {
      setLoadingExperiments(false)
    }
  }
  
  const fetchVersions = async () => {
    if (!modelId) return
    try {
      setLoadingVersions(true)
      const data = await experimentsApi.listVersions(Number(modelId))
      setVersions(data)
    } catch (err: any) {
      console.error('Failed to load versions:', err)
    } finally {
      setLoadingVersions(false)
    }
  }
  
  const fetchTests = async () => {
    if (!modelId) return
    try {
      setLoadingTests(true)
      const data = await experimentsApi.listTests(Number(modelId))
      setTests(data)
    } catch (err: any) {
      console.error('Failed to load tests:', err)
    } finally {
      setLoadingTests(false)
    }
  }

  const fetchModel = async () => {
    try {
      const response = await api.get(`/models/${modelId}`)
      setModel(response.data)
    } catch (error) {
      console.error('Failed to fetch model:', error)
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

  const handleDownload = async () => {
    if (!model?.ipfs_gateway_url) return

    setDownloading(true)
    try {
      const response = await fetch(model.ipfs_gateway_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${model.name}.${model.file_format || 'bin'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  if (!model) {
    return <div className="p-6">Model not found</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link
        to={`/groups/${groupId}/models`}
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Models
      </Link>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{model.name}</h1>
            <p className="text-gray-600">{model.description || 'No description'}</p>
          </div>
          {model.ipfs_gateway_url && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {downloading ? 'Downloading...' : 'Download'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Version</h3>
            <p className="text-gray-900">{model.version}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">License</h3>
            <p className="text-gray-900">{model.license}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">File Size</h3>
            <p className="text-gray-900">{formatFileSize(model.file_size)}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Format</h3>
            <p className="text-gray-900">{model.file_format || 'Unknown'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
            <p className="text-gray-900">
              {new Date(model.created_at).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
            <p className="text-gray-900">
              {model.is_encrypted ? (
                <span className="text-yellow-600">Encrypted</span>
              ) : (
                <span className="text-green-600">Public</span>
              )}
            </p>
          </div>
        </div>

        {model.ipfs_cid && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">IPFS Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">CID: </span>
                <code className="text-sm bg-white px-2 py-1 rounded">{model.ipfs_cid}</code>
              </div>
              {model.ipfs_gateway_url && (
                <div>
                  <span className="text-sm text-gray-600">Gateway: </span>
                  <a
                    href={model.ipfs_gateway_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    {model.ipfs_gateway_url}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {model.tags && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {model.tags.split(',').map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {model.license_text && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">License Text</h3>
            <pre className="text-sm bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {model.license_text}
            </pre>
          </div>
        )}

        {model.source && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Source</h3>
            {model.source_url ? (
              <a
                href={model.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {model.source_url}
              </a>
            ) : (
              <p className="text-gray-900 capitalize">{model.source}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

