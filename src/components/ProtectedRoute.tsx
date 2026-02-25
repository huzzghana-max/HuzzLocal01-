import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isLoggedIn, user, isLoading } = useAuth()

  // Show loading state while auth is being checked
  if (isLoading) {
    return null
  }

  // If not logged in, redirect to sign-in
  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />
  }

  // If role is required and doesn't match, redirect to appropriate dashboard
  if (requiredRole && user) {
    if (user.role !== requiredRole) {
      // Redirect to user's own dashboard
      if (user.role === 'provider') {
        return <Navigate to="/provider-dashboard" replace />
      } else if (user.role === 'admin') {
        return <Navigate to="/admin-dashboard" replace />
      } else {
        return <Navigate to="/organizer-dashboard" replace />
      }
    }
  }

  return <>{children}</>
}

export default ProtectedRoute
