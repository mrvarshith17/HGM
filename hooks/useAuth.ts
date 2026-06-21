import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSession, getCurrentUser, deleteSession } from '@/lib/db-session-service'

export interface User {
  uid: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
  salonId?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let isMounted = true
    let redirectTimeout: NodeJS.Timeout

    const checkAuth = async () => {
      try {
        const session = await getCurrentUser()
        if (isMounted) {
          if (session) {
            setUser({
              uid: session.userId,
              email: session.email,
              name: session.name,
              phone: session.phone,
              userType: session.userType,
              profilePicture: session.profilePicture,
              salonId: session.salonId,
            })
          }
        }
      } catch (error) {
        console.error('[useAuth] Failed to get current user:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
      if (redirectTimeout) clearTimeout(redirectTimeout)
    }
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

      // Create session in database
      const session = await createSession({
        userId: result.uid,
        email: result.email,
        name: data.name,
        phone: data.phone,
        userType: data.userType,
        profilePicture: result.profilePicture,
      })

      setUser({
        uid: session.userId,
        email: session.email,
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

      // Create session in database
      const session = await createSession({
        userId: result.uid,
        email: result.email,
        name: result.name,
        phone: result.phone,
        userType: result.userType,
        salonId: result.salonId,
        profilePicture: result.profilePicture,
      })

      setUser({
        uid: session.userId,
        email: session.email,
        name: session.name,
        phone: session.phone,
        userType: session.userType as 'customer' | 'salon_owner',
        salonId: session.salonId,
      })

      // Wait a moment for cookies to be set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const redirectPath = session.userType === 'customer' ? '/dashboard/user' : '/dashboard/owner'
      router.push(redirectPath)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      if (user) {
        await deleteSession(user.uid)
      }
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [user, router])

  return { user, loading, register, login, logout }
}
