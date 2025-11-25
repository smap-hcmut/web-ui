import { useState } from 'react'
import { authService } from '@/lib/api/services/auth.service'

interface UseSendOtpReturn {
  sendOtp: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string | null
  isSuccess: boolean
}

export const useSendOtp = (): UseSendOtpReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const sendOtp = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      await authService.sendOtp(email, password)
      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { sendOtp, isLoading, error, isSuccess }
}

interface UseVerifyOtpReturn {
  verifyOtp: (email: string, otp: string) => Promise<void>
  isLoading: boolean
  error: string | null
  isSuccess: boolean
  token: string | null
}

export const useVerifyOtp = (): UseVerifyOtpReturn => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  const verifyOtp = async (email: string, otp: string) => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const response = await authService.verifyOtp(email, otp)

      // Store token
      if (response.token) {
        localStorage.setItem('auth_token', response.token)
        setToken(response.token)
      }

      setIsSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return { verifyOtp, isLoading, error, isSuccess, token }
}
