import apiClient from '../config'

interface RegisterPayload {
  email: string
  password: string
}

interface RegisterResponse {
  message?: string
  data?: any
}

interface LoginPayload {
  device_name: string
  email: string
  ip_address: string
  password: string
  remember: boolean
  user_agent: string
}

interface LoginResponse {
  message?: string
  data?: any
  token?: string
}

interface SendOtpPayload {
  email: string
  password: string
}

interface SendOtpResponse {
  message?: string
  data?: any
}

interface VerifyOtpPayload {
  email: string
  otp: string
}

interface VerifyOtpResponse {
  message?: string
  data?: any
  token?: string
}

export const authService = {
  register: async (email: string, password: string): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/authentication/register', {
      email,
      password,
    })
    return response.data
  },

  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/authentication/login', payload)
    return response.data
  },

  sendOtp: async (email: string, password: string): Promise<SendOtpResponse> => {
    const response = await apiClient.post<SendOtpResponse>('/authentication/send-otp', {
      email,
      password,
    })
    return response.data
  },

  verifyOtp: async (email: string, otp: string): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/authentication/verify-otp', {
      email,
      otp,
    })
    return response.data
  },
}
