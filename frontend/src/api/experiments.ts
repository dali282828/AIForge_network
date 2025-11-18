import api from './client'

export interface Experiment {
  id: number
  model_id: number
  group_id?: number
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  created_by: number
  created_at: string
  updated_at?: string
}

export interface ExperimentRun {
  id: number
  experiment_id: number
  job_id?: string
  run_number: number
  name?: string
  hyperparameters?: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  metrics?: Record<string, any>
  output_model_cid?: string
  error?: string
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface ExperimentWithRuns extends Experiment {
  runs: ExperimentRun[]
}

export interface ModelVersion {
  id: number
  model_id: number
  version: string
  run_id?: number
  model_cid?: string
  minio_path?: string
  description?: string
  is_current: boolean
  metrics?: Record<string, any>
  created_by: number
  created_at: string
}

export interface InferenceTest {
  id: number
  model_id: number
  model_version_id?: number
  name: string
  test_type: 'single' | 'batch' | 'benchmark'
  prompts: string[]
  expected_outputs?: string[]
  results?: Record<string, any>
  metrics?: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed'
  created_by: number
  created_at: string
  completed_at?: string
}

export interface ExperimentCreate {
  model_id: number
  group_id?: number
  name: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
}

export interface ExperimentRunCreate {
  experiment_id: number
  name?: string
  hyperparameters?: Record<string, any>
}

export interface ModelVersionCreate {
  model_id: number
  version: string
  run_id?: number
  model_cid?: string
  minio_path?: string
  description?: string
  is_current?: boolean
  metrics?: Record<string, any>
}

export interface InferenceTestCreate {
  model_id: number
  model_version_id?: number
  name: string
  test_type?: 'single' | 'batch' | 'benchmark'
  prompts: string[]
  expected_outputs?: string[]
}

export const experimentsApi = {
  // Experiments
  createExperiment: async (modelId: number, data: ExperimentCreate) => {
    const response = await api.post<Experiment>(`/experiments/models/${modelId}/experiments`, data)
    return response.data
  },

  listExperiments: async (modelId: number, status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get<Experiment[]>(`/experiments/models/${modelId}/experiments`, { params })
    return response.data
  },

  getExperiment: async (experimentId: number) => {
    const response = await api.get<ExperimentWithRuns>(`/experiments/experiments/${experimentId}`)
    return response.data
  },

  updateExperiment: async (experimentId: number, data: Partial<ExperimentCreate>) => {
    const response = await api.put<Experiment>(`/experiments/experiments/${experimentId}`, data)
    return response.data
  },

  // Experiment Runs
  createRun: async (experimentId: number, data: ExperimentRunCreate) => {
    const response = await api.post<ExperimentRun>(`/experiments/experiments/${experimentId}/runs`, data)
    return response.data
  },

  listRuns: async (experimentId: number) => {
    const response = await api.get<ExperimentRun[]>(`/experiments/experiments/${experimentId}/runs`)
    return response.data
  },

  getRun: async (runId: number) => {
    const response = await api.get<ExperimentRun>(`/experiments/runs/${runId}`)
    return response.data
  },

  // Model Versions
  createVersion: async (modelId: number, data: ModelVersionCreate) => {
    const response = await api.post<ModelVersion>(`/experiments/models/${modelId}/versions`, data)
    return response.data
  },

  listVersions: async (modelId: number) => {
    const response = await api.get<ModelVersion[]>(`/experiments/models/${modelId}/versions`)
    return response.data
  },

  // Inference Tests
  createTest: async (modelId: number, data: InferenceTestCreate) => {
    const response = await api.post<InferenceTest>(`/experiments/models/${modelId}/tests`, data)
    return response.data
  },

  listTests: async (modelId: number, modelVersionId?: number) => {
    const params = modelVersionId ? { model_version_id: modelVersionId } : {}
    const response = await api.get<InferenceTest[]>(`/experiments/models/${modelId}/tests`, { params })
    return response.data
  },

  getTest: async (testId: number) => {
    const response = await api.get<InferenceTest>(`/experiments/tests/${testId}`)
    return response.data
  },
}

