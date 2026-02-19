import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Email as EmailIcon, Phone as PhoneIcon, LocationOn as LocationIcon } from '@mui/icons-material'
import api from '../api'

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const theme = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Call the backend API to send the contact email
      const response = await api.post('/contact', formData)
      
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.'
      setError(errorMsg)
      console.error('Contact form error:', err)
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    {
      icon: EmailIcon,
      title: 'Email',
      info: 'jonathandraft02@gmail.com',
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      info: '+233 597 779 886',
    },
    {
      icon: LocationIcon,
      title: 'Address',
      info: 'University of Prefessional Studies Accra, Madina',
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            mb: 2,
            color: theme.palette.primary.main,
            fontSize: { xs: '2rem', md: '3rem' },
          }}
        >
          Get In Touch
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: '1.1rem',
            color: theme.palette.text.secondary,
            mb: 6,
          }}
        >
          Have questions? We'd love to hear from you. Reach out anytime.
        </Typography>

        <Grid container spacing={4}>
          {/* Contact Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            {contactInfo.map((item, idx) => {
              const IconComponent = item.icon
              return (
                <Card
                  key={idx}
                  sx={{
                    mb: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'light' 
                        ? '0 8px 24px rgba(31, 77, 92, 0.12)' 
                        : '0 8px 24px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                >
                  <CardContent sx={{ display: 'flex', gap: 2 }}>
                    <IconComponent sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {item.title}
                      </Typography>
                      <Typography color="textSecondary">{item.info}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Grid>

          {/* Contact Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                {submitted && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Message sent successfully! We'll get back to you soon.
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    margin="normal"
                    variant="outlined"
                    disabled={loading}
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
                    variant="outlined"
                    disabled={loading}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    margin="normal"
                    variant="outlined"
                    multiline
                    rows={5}
                    disabled={loading}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: '12px',
                      fontSize: '1rem',
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
                      '&:hover:not(:disabled)': {
                        boxShadow: '0 8px 25px rgba(14, 59, 38, 0.4)',
                        transform: 'translateY(-2px)',
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:active:not(:disabled)': {
                        transform: 'translateY(0)',
                      },
                      '&:disabled': {
                        opacity: 0.7,
                        cursor: 'not-allowed',
                      },
                    }}
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} sx={{ color: 'inherit' }} />
                        Sending...
                      </Box>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Contact
