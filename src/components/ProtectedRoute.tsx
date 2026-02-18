import React from 'react'
import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')

  // If no token, redirect to sign-in
  if (!token) {
    return <Navigate to="/sign-in" replace />
  }

  // If role is required and doesn't match, redirect to appropriate dashboard
  if (requiredRole && userStr) {
    const user = JSON.parse(userStr)
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
