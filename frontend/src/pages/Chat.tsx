import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getWebUIToken, WebUIToken } from '../api/chat'

// Determine Open WebUI URL
// In production, this should point to your Open WebUI deployment
// For local development, default to localhost:3000
const getOpenWebUIUrl = (): string => {
  const envUrl = import.meta.env.VITE_OPEN_WEBUI_URL
  if (envUrl) return envUrl
  
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  
  return isLocalhost 
    ? 'http://localhost:3000' 
    : 'https://webui.aiforge.network' // Update with your Open WebUI deployment URL
}

export default function Chat() {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const [webuiToken, setWebuiToken] = useState<WebUIToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [iframeUrl, setIframeUrl] = useState<string>('')
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    if (!user || !token) {
      setError('Please log in to use the chat interface')
      setLoading(false)
      return
    }

    loadWebUIToken()
  }, [user, token])

  const loadWebUIToken = async () => {
    try {
      setLoading(true)
      setError(null)
      const tokenData = await getWebUIToken()
      setWebuiToken(tokenData)
      
      // Construct iframe URL with API configuration
      const webuiUrl = getOpenWebUIUrl()
      const apiBaseUrl = tokenData.api_base_url
      const apiKey = tokenData.api_key
      
      // Open WebUI requires user authentication, but we can pass API key via URL
      // The API key will be used for OpenAI API calls
      // Note: Open WebUI still needs a user account, but we'll use a default one
      const url = new URL(webuiUrl)
      
      // Store API key in sessionStorage for Open WebUI to use
      // Open WebUI will use this when making API calls
      sessionStorage.setItem('aiforge_api_key', apiKey)
      sessionStorage.setItem('aiforge_api_base_url', apiBaseUrl)
      
      setIframeUrl(url.toString())
      setLoading(false)
    } catch (err: any) {
      console.error('Failed to load WebUI token:', err)
      setError(err.response?.data?.detail || 'Failed to initialize chat interface')
      setLoading(false)
    }
  }

  // Check if Open WebUI is accessible
  useEffect(() => {
    if (iframeUrl) {
      // Try to load Open WebUI to check if it's available
      const checkWebUI = async () => {
        try {
          const webuiUrl = getOpenWebUIUrl()
          await fetch(webuiUrl, { method: 'HEAD', mode: 'no-cors' })
          // If we get here, WebUI might be available (CORS might block, but that's OK)
          setShowSetup(false)
        } catch (err) {
          // WebUI not accessible, show setup instructions
          setShowSetup(true)
        }
      }
      checkWebUI()
    }
  }, [iframeUrl])

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to use the chat interface.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat interface...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadWebUIToken}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (showSetup || !iframeUrl) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6">Open WebUI Setup</h1>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              To use the chat interface, you need to deploy Open WebUI and configure it to use the AIForge backend.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">Step 1: Deploy Open WebUI</h2>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <pre className="text-sm overflow-x-auto">
{`# Using Docker
docker run -d \\
  --name open-webui \\
  -p 3000:8080 \\
  -e OPENAI_API_BASE_URL=${webuiToken?.api_base_url || '/api/v1'} \\
  -e OPENAI_API_KEY=${webuiToken?.api_key || 'YOUR_API_KEY'} \\
  --add-host=host.docker.internal:host-gateway \\
  -v open-webui:/app/backend/data \\
  --restart always \\
  ghcr.io/open-webui/open-webui:main`}
                </pre>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Step 2: Configure Environment Variables</h2>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded space-y-2">
                <div>
                  <strong>API Base URL:</strong>
                  <code className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                    {webuiToken?.api_base_url || 'Not available'}
                  </code>
                </div>
                <div>
                  <strong>API Key:</strong>
                  <code className="ml-2 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                    {webuiToken?.api_key || 'Not available'}
                  </code>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-3">Step 3: Update Frontend Configuration</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Set the <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">VITE_OPEN_WEBUI_URL</code> environment variable to your Open WebUI deployment URL.
              </p>
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                <pre className="text-sm">
{`# .env file
VITE_OPEN_WEBUI_URL=http://localhost:3000`}
                </pre>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSetup(false)
                  if (iframeUrl) {
                    // Try to load iframe
                    window.location.reload()
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                I've Set Up Open WebUI
              </button>
              <button
                onClick={loadWebUIToken}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Refresh Token
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <p className="text-sm text-gray-500">Powered by Open WebUI</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSetup(true)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Setup
          </button>
          <button
            onClick={loadWebUIToken}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Open WebUI iframe */}
      <iframe
        src={iframeUrl}
        className="flex-1 w-full border-0"
        title="Open WebUI Chat"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  )
}
