import apiClient from '../config'

interface RegisterPayload {
  email: string
  password: string
}

interface RegisterResponse {
  message?: string
  data?: any
}

export const authService = {
  register: async (email: string, password: string): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/authentication/register', {
      email,
      password,
    })
    return response.data
  },
}
