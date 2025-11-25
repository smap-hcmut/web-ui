import apiClient from '../config'
import { Project, Brand } from '@/contexts/DashboardContext'

interface CreateProjectPayload {
  name: string
  description: string
  brands: Omit<Brand, 'id'>[]
  competitors: Omit<Brand, 'id'>[]
}

interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  id: string
}

interface ProjectResponse {
  data: Project
  message?: string
}

interface ProjectsListResponse {
  data: Project[]
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
  }
}

export const projectService = {
  // Get all projects
  getProjects: async (): Promise<ProjectsListResponse> => {
    const response = await apiClient.get<ProjectsListResponse>('/projects')
    return response.data
  },

  // Get single project by ID
  getProject: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`)
    return response.data
  },

  // Create new project
  createProject: async (payload: CreateProjectPayload): Promise<ProjectResponse> => {
    const response = await apiClient.post<ProjectResponse>('/projects', payload)
    return response.data
  },

  // Update existing project
  updateProject: async (payload: UpdateProjectPayload): Promise<ProjectResponse> => {
    const { id, ...data } = payload
    const response = await apiClient.put<ProjectResponse>(`/projects/${id}`, data)
    return response.data
  },

  // Delete project
  deleteProject: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/projects/${id}`)
    return response.data
  },

  // Update project status
  updateProjectStatus: async (
    id: string,
    status: 'active' | 'inactive' | 'processing'
  ): Promise<ProjectResponse> => {
    const response = await apiClient.patch<ProjectResponse>(`/projects/${id}/status`, {
      status,
    })
    return response.data
  },
}
