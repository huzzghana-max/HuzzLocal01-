import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const navigate = useNavigate()
  const theme = useTheme()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }

        // Route based on user role
        const userRole = response.data.user.role
        if (userRole === 'admin') {
          navigate('/admin-dashboard')
        } else if (userRole === 'provider') {
          navigate('/provider-dashboard')
        } else {
          navigate('/organizer-dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <LoginIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome Back
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Sign in to your Huzz account
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Sign In Form */}
        <Paper
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 20px rgba(31, 77, 92, 0.1)'
              : '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <form onSubmit={handleSignIn}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              placeholder="your@email.com"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              placeholder="••••••••"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: theme.palette.secondary.main,
                  },
                },
              }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{ color: theme.palette.secondary.main }}
                />
              }
              label="Remember me"
              sx={{ my: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                py: 2,
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(14, 59, 38, 0.3)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  transition: 'left 0.35s ease-out',
                },
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(14, 59, 38, 0.4)',
                  transform: 'translateY(-2px)',
                  '&::before': {
                    left: '100%',
                  },
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  opacity: 0.7,
                  boxShadow: '0 2px 8px rgba(14, 59, 38, 0.2)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Sign In'
              )}
            </Button>

            <Typography sx={{ textAlign: 'center', mt: 3, color: theme.palette.text.secondary }}>
              Don't have an account?{' '}
              <Link
                to="/signup"
                style={{ 
                  color: theme.palette.secondary.main, 
                  textDecoration: 'none', 
                  fontWeight: 600 
                }}
              >
                Sign Up
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default SignIn

