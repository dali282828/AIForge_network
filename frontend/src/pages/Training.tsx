import React, { useState, useEffect } from 'react';
import api from '../api/client';

interface TrainingJob {
  job_id: string;
  status: string;
  progress: number;
  base_model: string;
  output_model_name: string;
  framework: string;
  hyperparameters: {
    learning_rate: number;
    num_epochs: number;
    batch_size: number;
  };
  output_model_cid?: string;
  training_metrics?: any;
  error?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface TrainingFormData {
  base_model: string;
  dataset_cid: string;
  dataset_path: string;
  framework: string;
  output_model_name: string;
  learning_rate: number;
  num_epochs: number;
  batch_size: number;
  gpus: number;
  memory_limit: string;
  cpu_limit: number;
  base_model_id?: number;
  group_id?: number;
}

const Training: React.FC = () => {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<TrainingFormData>({
    base_model: '',
    dataset_cid: '',
    dataset_path: '',
    framework: 'huggingface',
    output_model_name: '',
    learning_rate: 2e-5,
    num_epochs: 3,
    batch_size: 4,
    gpus: 1,
    memory_limit: '16G',
    cpu_limit: 4.0,
  });
  useEffect(() => {
    loadJobs();
    
    // Poll for job updates every 5 seconds
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs?type=finetune');
      // Filter for training jobs
      const trainingJobs = response.data.filter((job: any) => job.type === 'finetune');
      setJobs(trainingJobs);
    } catch (error) {
      console.error('Failed to load training jobs:', error);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trainingData = {
        base_model: formData.base_model,
        dataset_cid: formData.dataset_cid || undefined,
        dataset_path: formData.dataset_path || undefined,
        framework: formData.framework,
        output_model_name: formData.output_model_name,
        hyperparameters: {
          learning_rate: formData.learning_rate,
          num_epochs: formData.num_epochs,
          batch_size: formData.batch_size,
        },
        gpus: formData.gpus,
        memory_limit: formData.memory_limit,
        cpu_limit: formData.cpu_limit,
        base_model_id: formData.base_model_id || undefined,
        group_id: formData.group_id || undefined,
      };

      await api.post('/jobs/training', trainingData);
      setShowCreateForm(false);
      setFormData({
        base_model: '',
        dataset_cid: '',
        dataset_path: '',
        framework: 'huggingface',
        output_model_name: '',
        learning_rate: 2e-5,
        num_epochs: 3,
        batch_size: 4,
        gpus: 1,
        memory_limit: '16G',
        cpu_limit: 4.0,
      });
      loadJobs();
    } catch (error: any) {
      alert(`Failed to create training job: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Model Training</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Cancel' : 'Create Training Job'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Training Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Base Model</label>
                  <input
                    type="text"
                    value={formData.base_model}
                    onChange={(e) => setFormData({ ...formData, base_model: e.target.value })}
                    placeholder="e.g., mistral:instruct or QmXXX (IPFS CID)"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Output Model Name</label>
                  <input
                    type="text"
                    value={formData.output_model_name}
                    onChange={(e) => setFormData({ ...formData, output_model_name: e.target.value })}
                    placeholder="e.g., my-finetuned-model"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dataset IPFS CID</label>
                  <input
                    type="text"
                    value={formData.dataset_cid}
                    onChange={(e) => setFormData({ ...formData, dataset_cid: e.target.value })}
                    placeholder="QmXXX (optional if dataset_path provided)"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dataset Path</label>
                  <input
                    type="text"
                    value={formData.dataset_path}
                    onChange={(e) => setFormData({ ...formData, dataset_path: e.target.value })}
                    placeholder="MinIO path or local path (optional if dataset_cid provided)"
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Framework</label>
                  <select
                    value={formData.framework}
                    onChange={(e) => setFormData({ ...formData, framework: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="huggingface">HuggingFace Transformers</option>
                    <option value="pytorch">PyTorch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Learning Rate</label>
                  <input
                    type="number"
                    step="1e-6"
                    value={formData.learning_rate}
                    onChange={(e) => setFormData({ ...formData, learning_rate: parseFloat(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Epochs</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.num_epochs}
                    onChange={(e) => setFormData({ ...formData, num_epochs: parseInt(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GPUs</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.gpus}
                    onChange={(e) => setFormData({ ...formData, gpus: parseInt(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Memory Limit</label>
                  <input
                    type="text"
                    value={formData.memory_limit}
                    onChange={(e) => setFormData({ ...formData, memory_limit: e.target.value })}
                    placeholder="e.g., 16G"
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CPU Cores</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.cpu_limit}
                    onChange={(e) => setFormData({ ...formData, cpu_limit: parseFloat(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Training Job'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Training Jobs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No training jobs found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.job_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono">{job.job_id}</td>
                      <td className="px-6 py-4 text-sm">{job.base_model}</td>
                      <td className="px-6 py-4 text-sm">{job.output_model_name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${job.progress * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{Math.round(job.progress * 100)}%</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default Training;

