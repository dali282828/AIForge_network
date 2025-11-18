import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { experimentsApi, ExperimentWithRuns, ExperimentRun } from '../api/experiments'
import api from '../api/client'

export default function Experiments() {
  const { experimentId } = useParams<{ experimentId: string }>()
  const [experiment, setExperiment] = useState<ExperimentWithRuns | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Create run modal
  const [showCreateRunModal, setShowCreateRunModal] = useState(false)
  const [runForm, setRunForm] = useState({
    name: '',
    hyperparameters: {
      learning_rate: 2e-5,
      num_epochs: 3,
      batch_size: 4,
    }
  })
  
  // Create training job modal
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [selectedRun, setSelectedRun] = useState<ExperimentRun | null>(null)
  const [jobForm, setJobForm] = useState({
    base_model: '',
    dataset_cid: '',
    dataset_path: '',
    framework: 'huggingface' as 'huggingface' | 'pytorch',
    output_model_name: '',
    gpus: 1,
    memory_limit: '16G',
    cpu_limit: 4.0,
  })

  useEffect(() => {
    if (experimentId) {
      fetchExperiment()
    }
  }, [experimentId])

  const fetchExperiment = async () => {
    if (!experimentId) return
    try {
      setLoading(true)
      setError('')
      const data = await experimentsApi.getExperiment(Number(experimentId))
      setExperiment(data)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load experiment')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRun = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!experimentId) return
    
    try {
      await experimentsApi.createRun(Number(experimentId), {
        experiment_id: Number(experimentId),
        name: runForm.name || undefined,
        hyperparameters: runForm.hyperparameters
      })
      setShowCreateRunModal(false)
      setRunForm({ name: '', hyperparameters: { learning_rate: 2e-5, num_epochs: 3, batch_size: 4 } })
      fetchExperiment()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create run')
    }
  }

  const handleStartTraining = async (run: ExperimentRun) => {
    setSelectedRun(run)
    setShowCreateJobModal(true)
  }

  const handleCreateTrainingJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRun || !experiment) return
    
    try {
      const trainingData = {
        base_model: jobForm.base_model,
        dataset_cid: jobForm.dataset_cid || undefined,
        dataset_path: jobForm.dataset_path || undefined,
        framework: jobForm.framework,
        output_model_name: jobForm.output_model_name,
        hyperparameters: {
          learning_rate: selectedRun.hyperparameters?.learning_rate || 2e-5,
          num_epochs: selectedRun.hyperparameters?.num_epochs || 3,
          batch_size: selectedRun.hyperparameters?.batch_size || 4,
        },
        gpus: jobForm.gpus,
        memory_limit: jobForm.memory_limit,
        cpu_limit: jobForm.cpu_limit,
        group_id: experiment.group_id || undefined,
        experiment_id: experiment.id,
        run_id: selectedRun.id,
      }
      
      await api.post('/jobs/training', trainingData)
      setShowCreateJobModal(false)
      setJobForm({
        base_model: '',
        dataset_cid: '',
        dataset_path: '',
        framework: 'huggingface',
        output_model_name: '',
        gpus: 1,
        memory_limit: '16G',
        cpu_limit: 4.0,
      })
      fetchExperiment()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create training job')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="p-6">Loading experiment...</div>
  }

  if (error || !experiment) {
    return (
      <div className="p-6">
        <div className="text-red-600">{error || 'Experiment not found'}</div>
        <Link to="/training" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Training
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Link
        to="/training"
        className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
      >
        ← Back to Training
      </Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{experiment.name}</h1>
            {experiment.description && (
              <p className="text-gray-600">{experiment.description}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(experiment.status)}`}>
            {experiment.status}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Runs ({experiment.runs.length})</h2>
          <button
            onClick={() => setShowCreateRunModal(true)}
            className="btn-primary"
          >
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Run
          </button>
        </div>

        {experiment.runs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No runs yet. Create a run to start training.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {experiment.runs.map((run) => (
              <div key={run.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {run.name || `Run ${run.run_number}`}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(run.status)}`}>
                        {run.status}
                      </span>
                      {run.job_id && (
                        <span className="text-xs text-gray-500">Job: {run.job_id}</span>
                      )}
                    </div>
                    
                    {run.hyperparameters && (
                      <div className="text-sm text-gray-600 mb-2">
                        <div className="grid grid-cols-3 gap-4">
                          <div>LR: {run.hyperparameters.learning_rate}</div>
                          <div>Epochs: {run.hyperparameters.num_epochs}</div>
                          <div>Batch: {run.hyperparameters.batch_size}</div>
                        </div>
                      </div>
                    )}
                    
                    {run.metrics && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Metrics:</strong> {JSON.stringify(run.metrics)}
                      </div>
                    )}
                    
                    {run.error && (
                      <div className="text-sm text-red-600 mb-2">
                        <strong>Error:</strong> {run.error}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {run.started_at && (
                        <span>Started: {new Date(run.started_at).toLocaleString()}</span>
                      )}
                      {run.completed_at && (
                        <span>Completed: {new Date(run.completed_at).toLocaleString()}</span>
                      )}
                      {run.status === 'running' && (
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${run.progress * 100}%` }}
                            />
                          </div>
                          <span>{Math.round(run.progress * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!run.job_id && run.status === 'pending' && (
                      <button
                        onClick={() => handleStartTraining(run)}
                        className="btn-primary text-sm"
                      >
                        Start Training
                      </button>
                    )}
                    {run.status === 'completed' && run.output_model_cid && (
                      <button
                        onClick={() => {
                          // TODO: Create model version from this run
                          alert('Create version feature coming soon')
                        }}
                        className="btn-secondary text-sm"
                      >
                        Create Version
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Run Modal */}
      {showCreateRunModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Experiment Run</h2>
              <button
                onClick={() => setShowCreateRunModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateRun} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Run Name (optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={runForm.name}
                  onChange={(e) => setRunForm({ ...runForm, name: e.target.value })}
                  placeholder="e.g., Baseline, High LR, etc."
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Rate</label>
                  <input
                    type="number"
                    step="1e-6"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={runForm.hyperparameters.learning_rate}
                    onChange={(e) => setRunForm({
                      ...runForm,
                      hyperparameters: { ...runForm.hyperparameters, learning_rate: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Epochs</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={runForm.hyperparameters.num_epochs}
                    onChange={(e) => setRunForm({
                      ...runForm,
                      hyperparameters: { ...runForm.hyperparameters, num_epochs: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={runForm.hyperparameters.batch_size}
                    onChange={(e) => setRunForm({
                      ...runForm,
                      hyperparameters: { ...runForm.hyperparameters, batch_size: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRunModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Training Job Modal */}
      {showCreateJobModal && selectedRun && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="card p-6 max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Start Training Job</h2>
              <button
                onClick={() => setShowCreateJobModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateTrainingJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Model *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.base_model}
                    onChange={(e) => setJobForm({ ...jobForm, base_model: e.target.value })}
                    placeholder="e.g., mistral:instruct or QmXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Output Model Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.output_model_name}
                    onChange={(e) => setJobForm({ ...jobForm, output_model_name: e.target.value })}
                    placeholder="e.g., my-finetuned-model"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dataset IPFS CID</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.dataset_cid}
                    onChange={(e) => setJobForm({ ...jobForm, dataset_cid: e.target.value })}
                    placeholder="QmXXX (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dataset Path</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.dataset_path}
                    onChange={(e) => setJobForm({ ...jobForm, dataset_path: e.target.value })}
                    placeholder="MinIO path (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Framework</label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.framework}
                    onChange={(e) => setJobForm({ ...jobForm, framework: e.target.value as any })}
                  >
                    <option value="huggingface">HuggingFace</option>
                    <option value="pytorch">PyTorch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GPUs</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={jobForm.gpus}
                    onChange={(e) => setJobForm({ ...jobForm, gpus: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Hyperparameters (from Run)</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>Learning Rate: {selectedRun.hyperparameters?.learning_rate || 2e-5}</div>
                  <div>Epochs: {selectedRun.hyperparameters?.num_epochs || 3}</div>
                  <div>Batch Size: {selectedRun.hyperparameters?.batch_size || 4}</div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateJobModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Start Training
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

