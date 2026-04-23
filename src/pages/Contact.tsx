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
import MarketingHero from '../components/MarketingHero'
import { getErrorMessage } from '../utils/errorHandler'
import { validateContactForm } from '../utils/validation'

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; message?: string }>({})
  const theme = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setFieldErrors((current) => ({ ...current, [e.target.name]: '' }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const validation = validateContactForm(formData)
    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      setError('Please fix the highlighted fields and try again.')
      return
    }

    setLoading(true)

    try {
      await api.post('/contact', validation.values)
      setSubmitted(true)
      setFormData({ name: '', email: '', message: '' })
      setFieldErrors({})
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to send message. Please try again.')
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
        <MarketingHero
          badge="CONTACT & SUPPORT"
          title="Start a conversation with the HUZZ team."
          subtitle="For support requests, partnerships, or product questions, send us a message and we will reply quickly."
          imageUrl="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1400&q=80"
        />

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
                      <TextField
                        fullWidth
                        label="Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={Boolean(fieldErrors.name)}
                        helperText={fieldErrors.name}
                        required
                        disabled={loading}
                        inputProps={{ maxLength: 80 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
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
                        disabled={loading}
                        inputProps={{ maxLength: 120 }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        error={Boolean(fieldErrors.message)}
                        helperText={fieldErrors.message ?? `${formData.message.length}/2000`}
                        required
                        multiline
                        rows={6}
                        disabled={loading}
                        inputProps={{ maxLength: 2000 }}
                      />
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
