/**
 * Authentication Context
 * Centralized state management for authentication and user data
 * Replaces scattered localStorage calls throughout the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: 'organizer' | 'provider' | 'admin'
  profile_image?: string
  [key: string]: unknown
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
  rememberMe: boolean
  login: (user: User, token: string, rememberMe?: boolean) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  setRememberMe: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [rememberMe, setRememberMeState] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUserStr = localStorage.getItem('user')
    const storedRememberMe = localStorage.getItem('rememberMe') === 'true'

    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr)
        setToken(storedToken)
        setUser(storedUser)
        setRememberMeState(storedRememberMe)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((user: User, token: string, rememberMe = false) => {
    setUser(user)
    setToken(token)
    setRememberMeState(rememberMe)

    // Persist to localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true')
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setRememberMeState(false)

    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('rememberMe')
  }, [])

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...updates }
      // Persist to localStorage
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const setRememberMe = useCallback((value: boolean) => {
    setRememberMeState(value)
    if (value) {
      localStorage.setItem('rememberMe', 'true')
    } else {
      localStorage.removeItem('rememberMe')
    }
  }, [])

  const value: AuthContextType = {
    user,
    token,
    isLoggedIn: !!user && !!token,
    isLoading,
    rememberMe,
    login,
    logout,
    updateUser,
    setRememberMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use the Auth Context
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
