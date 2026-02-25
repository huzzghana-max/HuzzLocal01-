import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import api from '../api.js'
import DashboardSidebar from '../components/DashboardSidebar'
import { useNavigate } from 'react-router-dom'

const CATEGORIES = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'billing', label: 'Billing' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
]

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#4caf50' },
  { value: 'medium', label: 'Medium', color: '#ff9800' },
  { value: 'high', label: 'High', color: '#f44336' },
]

const Contacts: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'other',
    priority: 'medium',
  })
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      navigate('/sign-in')
    }
  }, [navigate])

  // Auto-detect priority based on keywords in subject/message
  const autoDetectPriority = (subject: string, message: string) => {
    const text = (subject + ' ' + message).toLowerCase()
    const highKeywords = ['urgent', 'critical', 'broken', 'crash', 'down']
    const lowKeywords = ['question', 'suggestion', 'feedback']

    if (highKeywords.some(k => text.includes(k))) return 'high'
    if (lowKeywords.some(k => text.includes(k))) return 'low'
    return 'medium'
  }

  const handleChange = (k: string, v: string) => {
    setForm(s => ({ ...s, [k]: v }))

    // Auto-detect priority when subject or message changes
    if (k === 'subject' || k === 'message') {
      const newPriority = autoDetectPriority(
        k === 'subject' ? v : form.subject,
        k === 'message' ? v : form.message
      )
      setForm(s => ({ ...s, priority: newPriority }))
    }
  }

  const handleSend = async () => {
    setError(null)
    setSuccess(null)

    if (!form.email || !form.subject || !form.message) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      setSending(true)
      await api.post('/contacts/send-email', {
        name: form.name || (user?.name ?? 'Guest'),
        email: form.email,
        subject: form.subject,
        message: form.message,
        category: form.category,
        priority: form.priority,
      })
      setSuccess('Email sent successfully!')
      setForm({ name: '', email: '', subject: '', message: '', category: 'other', priority: 'medium' })
    } catch (err) {
      console.error('Email send error:', err)
      setError('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {user && (
        <DashboardSidebar
          userRole={user.role}
          userName={user.name}
          userEmail={user.email}
          userImage={user.profile_image}
          messages={0}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
      )}

      <Box sx={{ flex: 1, ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Contact Support
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Send us an email and we'll get back to you as soon as possible.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Name"
                placeholder={user?.name || 'Your Name'}
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                disabled={sending}
              />
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                disabled={sending}
                required
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth disabled={sending}>
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={form.category}
                    label="Category *"
                    onChange={e => handleChange('category', e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={sending}>
                  <InputLabel>Priority *</InputLabel>
                  <Select
                    value={form.priority}
                    label="Priority *"
                    onChange={e => handleChange('priority', e.target.value)}
                  >
                    {PRIORITIES.map(pri => (
                      <MenuItem key={pri.value} value={pri.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: pri.color,
                            }}
                          />
                          {pri.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Subject *"
                value={form.subject}
                onChange={e => handleChange('subject', e.target.value)}
                disabled={sending}
                required
              />
              <TextField
                fullWidth
                label="Message *"
                value={form.message}
                onChange={e => handleChange('message', e.target.value)}
                multiline
                rows={6}
                disabled={sending}
                required
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setForm({ name: '', email: '', subject: '', message: '', category: 'other', priority: 'medium' })}
                  disabled={sending}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={sending}
                  startIcon={sending && <CircularProgress size={20} />}
                >
                  {sending ? 'Sending...' : 'Send Email'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default Contacts
