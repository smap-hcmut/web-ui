import apiClient from '../config'
import { Project, Brand } from '@/contexts/DashboardContext'

// Backend API response interface
interface ApiProject {
  id: string
  name: string
  description: string
  brand_name: string
  brand_keywords: string[]
  competitor_names: string[]
  competitor_keywords_map: Record<string, string[]>
  status: string
  from_date: string
  to_date: string
  created_at: string
  updated_at: string
  created_by: string
}

// Backend API request payload for creating project
interface CreateProjectApiPayload {
  name: string
  description: string
  brand_name: string
  brand_keywords: string[]
  competitor_names: string[]
  competitor_keywords_map: Record<string, string[]>
  from_date: string
  to_date: string
  status: string
}

// Frontend payload interface
export interface CreateProjectPayload {
  name: string
  description: string
  brands: Omit<Brand, 'id'>[]
  competitors: Omit<Brand, 'id'>[]
  fromDate?: string
  toDate?: string
  status?: 'active' | 'inactive' | 'processing'
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

// Transform API response to frontend Project format
const transformApiProject = (apiProject: ApiProject): Project => {
  // Transform brand
  const brand: Brand = {
    id: 'b1',
    name: apiProject.brand_name,
    type: 'own',
    keywords: apiProject.brand_keywords,
    urls: [],
  }

  // Transform competitors
  const competitors: Brand[] = apiProject.competitor_names.map((name, index) => ({
    id: `c${index + 1}`,
    name,
    type: 'competitor' as const,
    keywords: apiProject.competitor_keywords_map[name] || [],
    urls: [],
  }))

  return {
    id: apiProject.id,
    name: apiProject.name,
    description: apiProject.description,
    brands: [brand],
    competitors,
    createdAt: new Date(apiProject.created_at),
    status: apiProject.status as 'active' | 'inactive' | 'processing',
  }
}

// Transform frontend payload to backend API format
const transformToApiPayload = (payload: CreateProjectPayload): CreateProjectApiPayload => {
  // Get the first brand (assuming single brand per project)
  const brand = payload.brands[0]

  // Build competitor_keywords_map
  const competitor_keywords_map: Record<string, string[]> = {}
  payload.competitors.forEach((competitor) => {
    competitor_keywords_map[competitor.name] = competitor.keywords
  })

  return {
    name: payload.name,
    description: payload.description,
    brand_name: brand.name,
    brand_keywords: brand.keywords,
    competitor_names: payload.competitors.map((c) => c.name),
    competitor_keywords_map,
    from_date: payload.fromDate || new Date().toISOString(),
    to_date: payload.toDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // Default 90 days
    status: payload.status || 'active',
  }
}

export const projectService = {
  // Get all projects
  getProjects: async (): Promise<Project[]> => {
    const response = await apiClient.get<{ data: ApiProject[] }>('/project/projects')
    const projects = response.data.data || response.data
    return (Array.isArray(projects) ? projects : []).map(transformApiProject)
  },

  // Get single project by ID
  getProject: async (id: string): Promise<ProjectResponse> => {
    const response = await apiClient.get<ProjectResponse>(`/projects/${id}`)
    return response.data
  },

  // Create new project
  createProject: async (payload: CreateProjectPayload): Promise<Project> => {
    const apiPayload = transformToApiPayload(payload)
    const response = await apiClient.post<{ data: ApiProject }>('/project/projects', apiPayload)
    const apiProject = response.data.data || response.data
    return transformApiProject(apiProject as ApiProject)
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
