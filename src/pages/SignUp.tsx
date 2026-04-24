import React, { useEffect, useState } from 'react'
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
import { getErrorMessage } from '../utils/errorHandler'
import { normalizePasswordPolicy } from '../utils/passwordPolicy'
import { DEFAULT_PASSWORD_POLICY, getPasswordPolicyChecklist, validateSignUp } from '../utils/validation'

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'organizer',
  })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})
  const [passwordPolicy, setPasswordPolicy] = useState(DEFAULT_PASSWORD_POLICY)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => {
    const fetchPasswordPolicy = async () => {
      try {
        const response = await api.get('/password-policy')
        setPasswordPolicy(normalizePasswordPolicy(response.data))
      } catch (err) {
        console.error('Failed to fetch password policy:', err)
      }
    }

    fetchPasswordPolicy()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    setFieldErrors((current) => ({ ...current, [name]: '' }))
    setError('')
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      role: e.target.value,
    })
    setError('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const validation = validateSignUp(formData, passwordPolicy)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setError('Please fix the highlighted fields and try again.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        name: validation.values.name,
        email: validation.values.email,
        password: validation.values.password,
        role: validation.values.role,
      })

      if (response.data.token && response.data.user) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        const userRole = response.data.user.role
        if (userRole === 'provider') {
          navigate('/provider-dashboard')
        } else {
          navigate('/organizer-dashboard')
        }
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <PersonAddIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 1,
              color: theme.palette.primary.main,
            }}
          >
            Create Account
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            Join Huzz and start your event journey
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              required
              margin="normal"
              placeholder="Kwesi John"
              inputProps={{ maxLength: 80 }}
            />

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              required
              margin="normal"
              placeholder="your@email.com"
              inputProps={{ maxLength: 120 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              required
              margin="normal"
              placeholder="........"
              inputProps={{ minLength: passwordPolicy.minLength, maxLength: 128 }}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
              Password requirements: {getPasswordPolicyChecklist(passwordPolicy).join(' • ')}
            </Typography>

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
              required
              margin="normal"
              placeholder="........"
              inputProps={{ maxLength: 128 }}
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
                backgroundColor: '#414958',
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
                  backgroundColor: '#2B3240',
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
