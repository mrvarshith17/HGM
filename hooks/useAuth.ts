import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  uid: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      const userData = localStorage.getItem('userData')

      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Failed to parse user data:', error)
          localStorage.removeItem('authToken')
          localStorage.removeItem('userData')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const register = useCallback(async (data: {
    email: string
    password: string
    name: string
    phone: string
    userType: 'customer' | 'salon_owner'
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }

      const result = await response.json()
      // In production, get actual token from Firebase
      localStorage.setItem('authToken', result.uid)
      localStorage.setItem('userId', result.uid) // Store userId for chat pages
      localStorage.setItem('userType', data.userType)
      localStorage.setItem('userEmail', data.email)
      localStorage.setItem('userData', JSON.stringify({
        uid: result.uid,
        email: result.email,
        name: data.name,
        phone: data.phone,
        userType: data.userType,
      }))

      setUser({
        uid: result.uid,
        email: result.email,
        name: data.name,
        phone: data.phone,
        userType: data.userType,
      })

      router.push(data.userType === 'customer' ? '/search' : '/dashboard/salon')
    } catch (error) {
      console.error('Register error:', error)
      throw error
    }
  }, [router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const result = await response.json()
      localStorage.setItem('authToken', result.uid)
      localStorage.setItem('userId', result.uid) // Store userId for chat pages
      localStorage.setItem('userType', result.userType || 'customer')
      localStorage.setItem('userEmail', result.email)
      localStorage.setItem('userData', JSON.stringify(result))

      setUser(result)
      router.push(result.userType === 'customer' ? '/search' : '/dashboard/salon')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [router])

  const continueWithGoogle = useCallback(async (
    credential: string,
    options: {
      mode: 'login' | 'signup'
      name?: string
      phone?: string
      userType?: 'customer' | 'salon_owner'
    }
  ) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, ...options }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Google authentication failed')
      }

      const result = await response.json()
      localStorage.setItem('authToken', result.uid)
      localStorage.setItem('userId', result.uid) // Store userId for chat pages
      localStorage.setItem('userType', result.userType || 'customer')
      localStorage.setItem('userEmail', result.email)
      localStorage.setItem('userData', JSON.stringify(result))
      setUser(result)
      router.push(result.userType === 'customer' ? '/search' : '/dashboard/salon')
    } catch (error) {
      console.error('Google auth error:', error)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('authToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('salonId')
      localStorage.removeItem('userData')
      setUser(null)
      router.push('/')
    }
  }, [router])

  return { user, loading, register, login, continueWithGoogle, logout }
}
