import api from './client'

export type InfrastructureProvider = 'aws' | 'vultr' | 'gcp' | 'runpod' | 'vast_ai' | 'other'
export type InfrastructureType = 'gpu' | 'cpu' | 'both'
export type InfrastructureStatus = 'pending' | 'active' | 'inactive' | 'suspended'

export interface InfrastructureInvestment {
  id: number
  investor_id: number
  group_id?: number
  provider: InfrastructureProvider
  infrastructure_type: InfrastructureType
  resource_specs: Record<string, any>
  status: InfrastructureStatus
  allocated_to_model_id?: number
  allocated_at?: string
  total_earnings: string
  last_payout_at?: string
  created_at: string
}

export interface InfrastructureUsage {
  id: number
  investment_id: number
  model_id: number
  job_id?: number
  period: string
  hours_used: string
  requests_processed: number
  tokens_processed: number
  earnings: string
  earnings_rate: string
  created_at: string
}

export interface MyInfrastructureResponse {
  investments: InfrastructureInvestment[]
  total_earnings: string
  active_investments: number
}

export interface InfrastructureStats {
  total_investments: number
  active_investments: number
  total_earnings: string
  allocated_investments: number
  available_investments: number
}

export interface CreateInvestmentRequest {
  group_id?: number
  provider: InfrastructureProvider
  infrastructure_type: InfrastructureType
  resource_specs: Record<string, any>
  connection_info?: Record<string, any>
}

export interface AllocateRequest {
  model_id: number
}

export const infrastructureApi = {
  // Create investment
  createInvestment: async (data: CreateInvestmentRequest) => {
    const response = await api.post<InfrastructureInvestment>('/infrastructure/invest', data)
    return response.data
  },

  // Get user's investments
  getMyInvestments: async () => {
    const response = await api.get<MyInfrastructureResponse>('/infrastructure/my-investments')
    return response.data
  },

  // Get available investments
  getAvailable: async (infrastructureType?: InfrastructureType) => {
    const response = await api.get<InfrastructureInvestment[]>('/infrastructure/available', {
      params: infrastructureType ? { infrastructure_type: infrastructureType } : {}
    })
    return response.data
  },

  // Activate investment
  activate: async (investmentId: number) => {
    const response = await api.post<InfrastructureInvestment>(`/infrastructure/${investmentId}/activate`)
    return response.data
  },

  // Allocate to model
  allocate: async (investmentId: number, data: AllocateRequest) => {
    const response = await api.post<InfrastructureInvestment>(`/infrastructure/${investmentId}/allocate`, data)
    return response.data
  },

  // Deallocate from model
  deallocate: async (investmentId: number) => {
    const response = await api.post<InfrastructureInvestment>(`/infrastructure/${investmentId}/deallocate`)
    return response.data
  },

  // Get earnings
  getEarnings: async (investmentId: number, year?: number, month?: number) => {
    const response = await api.get(`/infrastructure/${investmentId}/earnings`, {
      params: { year, month }
    })
    return response.data
  },

  // Get stats
  getStats: async () => {
    const response = await api.get<InfrastructureStats>('/infrastructure/stats')
    return response.data
  }
}

