import api from './client'

export interface Project {
  id: number
  group_id: number
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  created_by: number
  created_at: string
  updated_at?: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: number
  created_by: number
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at?: string
}

export interface ProjectWithTasks extends Project {
  tasks: Task[]
}

export interface ProjectCreate {
  name: string
  description?: string
  status?: 'active' | 'completed' | 'archived'
}

export interface TaskCreate {
  title: string
  description?: string
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: number
  due_date?: string
}

export const workspaceApi = {
  // Projects
  createProject: async (groupId: number, data: ProjectCreate) => {
    const response = await api.post<Project>(`/workspace/groups/${groupId}/projects`, data)
    return response.data
  },

  listProjects: async (groupId: number, status?: string) => {
    const params = status ? { status } : {}
    const response = await api.get<Project[]>(`/workspace/groups/${groupId}/projects`, { params })
    return response.data
  },

  getProject: async (projectId: number) => {
    const response = await api.get<ProjectWithTasks>(`/workspace/projects/${projectId}`)
    return response.data
  },

  updateProject: async (projectId: number, data: Partial<ProjectCreate>) => {
    const response = await api.put<Project>(`/workspace/projects/${projectId}`, data)
    return response.data
  },

  deleteProject: async (projectId: number) => {
    await api.delete(`/workspace/projects/${projectId}`)
  },

  // Tasks
  createTask: async (projectId: number, data: TaskCreate) => {
    const response = await api.post<Task>(`/workspace/projects/${projectId}/tasks`, data)
    return response.data
  },

  listTasks: async (projectId: number, status?: string, assignedTo?: number) => {
    const params: any = {}
    if (status) params.status = status
    if (assignedTo) params.assigned_to = assignedTo
    const response = await api.get<Task[]>(`/workspace/projects/${projectId}/tasks`, { params })
    return response.data
  },

  getTask: async (taskId: number) => {
    const response = await api.get<Task>(`/workspace/tasks/${taskId}`)
    return response.data
  },

  updateTask: async (taskId: number, data: Partial<TaskCreate>) => {
    const response = await api.put<Task>(`/workspace/tasks/${taskId}`, data)
    return response.data
  },

  deleteTask: async (taskId: number) => {
    await api.delete(`/workspace/tasks/${taskId}`)
  },
}

