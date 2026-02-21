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
  Alert,
  CircularProgress,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
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
      await api.post('/contact', formData)
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to send message. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    { icon: EmailIcon, title: 'Email', info: 'jonathandraft02@gmail.com' },
    { icon: PhoneIcon, title: 'Phone', info: '+233 597 779 886' },
    { icon: LocationIcon, title: 'Address', info: 'University of Professional Studies Accra, Madina' },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 6, md: 10 }, display: 'grid', gap: 4 }}>
        <Box
          sx={{
            p: { xs: 2.4, md: 3.2 },
            borderRadius: 4,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            background:
              `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 36%),` +
              alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.05 : 0.16),
          }}
        >
          <Typography variant="h2" sx={{ fontWeight: 850, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
            Contact
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', color: 'text.secondary', maxWidth: 760, lineHeight: 1.65 }}>
            Questions, partnerships, or support needs. Send a message and our team will respond promptly.
          </Typography>
        </Box>

        <Grid container spacing={2.4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <StackCards contactInfo={contactInfo} />
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}` }}>
              <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
                {submitted && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Message sent successfully. We will get back to you soon.
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={1.6}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Your Name" name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={loading} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth label="Message" name="message" value={formData.message} onChange={handleChange} required multiline rows={6} disabled={loading} />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        sx={{
                          mt: 0.4,
                          py: 1.2,
                          borderRadius: 2.2,
                          fontWeight: 800,
                          textTransform: 'none',
                          boxShadow: `0 10px 22px ${alpha(theme.palette.primary.main, 0.28)}`,
                        }}
                      >
                        {loading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={18} sx={{ color: 'inherit' }} />
                            Sending...
                          </Box>
                        ) : (
                          'Send Message'
                        )}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

interface ContactInfoItem {
  icon: React.ElementType
  title: string
  info: string
}

const StackCards: React.FC<{ contactInfo: ContactInfoItem[] }> = ({ contactInfo }) => {
  const theme = useTheme()
  return (
    <Box sx={{ display: 'grid', gap: 1.4 }}>
      {contactInfo.map((item) => {
        const IconComponent = item.icon
        return (
          <Card key={item.title} sx={{ borderRadius: 3, boxShadow: 'none', border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}` }}>
            <CardContent sx={{ display: 'flex', gap: 1.6, p: 2.2 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 1.8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  color: theme.palette.primary.main,
                }}
              >
                <IconComponent />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, mb: 0.4 }}>{item.title}</Typography>
                <Typography sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{item.info}</Typography>
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}

export default Contact
