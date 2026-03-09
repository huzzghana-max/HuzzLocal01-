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
  FormGroup,
  Radio,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'organizer',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const theme = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      role: e.target.value,
    })
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Route based on user role
        const userRole = response.data.user.role
        if (userRole === 'provider') {
          navigate('/provider-dashboard')
        } else {
          navigate('/organizer-dashboard')
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
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
            <PersonAddIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
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
            Create Account
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Join Huzz and start your event journey
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Sign Up Form */}
        <Paper
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: theme.palette.mode === 'light'
              ? '0 4px 20px rgba(31, 77, 92, 0.1)'
              : '0 4px 20px rgba(0, 0, 0, 0.3)',
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <form onSubmit={handleSignUp}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="John Doe"
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="your@email.com"
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="••••••••"
            />

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              margin="normal"
              placeholder="••••••••"
            />

            <Typography sx={{ my: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              I want to be a:
            </Typography>

            <FormGroup sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Radio
                    checked={formData.role === 'organizer'}
                    onChange={handleRoleChange}
                    value="organizer"
                    sx={{ color: theme.palette.secondary.main }}
                  />
                }
                label="Event Organizer"
              />
              <FormControlLabel
                control={
                  <Radio
                    checked={formData.role === 'provider'}
                    onChange={handleRoleChange}
                    value="provider"
                    sx={{ color: theme.palette.secondary.main }}
                  />
                }
                label="Service Provider"
              />
            </FormGroup>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #414958 0%, #2B3240 100%)',
                py: 2,
                fontSize: '1rem',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(65, 73, 88, 0.3)',
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
                  boxShadow: '0 8px 25px rgba(65, 73, 88, 0.38)',
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
                  boxShadow: '0 2px 8px rgba(65, 73, 88, 0.22)',
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: 'white' }} />
              ) : (
                'Create Account'
              )}
            </Button>

            <Typography sx={{ textAlign: 'center', mt: 3, color: theme.palette.text.secondary }}>
              Already have an account?{' '}
              <Link
                to="/signin"
                style={{ color: theme.palette.secondary.main, textDecoration: 'none', fontWeight: 600 }}
              >
                Sign In
              </Link>
            </Typography>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default SignUp

