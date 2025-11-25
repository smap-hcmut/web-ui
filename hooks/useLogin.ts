import { useState } from 'react'
import { authService } from '@/lib/api/services/auth.service'

interface LoginPayload {
  device_name: string
  email: string
  ip_address: string
  password: string
  remember: boolean
  user_agent: string
}

interface UseLoginReturn {
  login: (payload: LoginPayload) => Promise<void>
  isLoading: boolean
  error: string | null
  isSuccess: boolean
}

export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const login = async (payload: LoginPayload) => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const response = await authService.login(payload)

      // Store token if provided (for non-OTP login)
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { login, isLoading, error, isSuccess }
}
