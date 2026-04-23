import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api.js'
import DashboardSidebar from '../components/DashboardSidebar'
import SendIcon from '@mui/icons-material/Send'
import BackIcon from '@mui/icons-material/ArrowBack'
import { getCategoryLabel } from '../constants/support'
import { getErrorMessage } from '../utils/errorHandler'
import { validateSupportReply } from '../utils/validation'

interface TicketMessage {
  id: number
  message: string
  created_at: string
  user_id: number
  name: string
  role: string
}

interface TicketDetail {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  user_name: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

interface LocalUser {
  role: string
  name: string
  email: string
  profile_image?: string
}

const TicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<LocalUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageError, setMessageError] = useState('')
  const [messageFeedback, setMessageFeedback] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    } else {
      navigate('/signin')
      return
    }

    fetchTicketDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, navigate])

  const fetchTicketDetail = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/support/tickets/${ticketId}`)
      setTicket(response.data.ticket)
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to fetch ticket:', error)
      alert('Failed to load ticket')
      navigate('/support')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    setMessageError('')
    setMessageFeedback('')

    const validation = validateSupportReply({ message: newMessage })
    if (!validation.isValid) {
      setMessageError(validation.errors.message || 'Message is required.')
      return
    }

    try {
      setSending(true)
      await api.post(`/support/tickets/${ticketId}/messages`, {
        message: validation.values.message,
      })

      setNewMessage('')
      setMessageFeedback('Message sent successfully.')
      fetchTicketDetail()
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessageFeedback(getErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.put(`/support/tickets/${ticketId}`, { status: newStatus })
      fetchTicketDetail()
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('Failed to update ticket status')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info'> = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      urgent: 'error',
    }
    return colors[priority] || 'default'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!ticket) {
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
        <Container maxWidth="lg" sx={{ py: 4, flex: 1, ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
          <Alert severity="error">Ticket not found</Alert>
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
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

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Header */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/support')} variant="text">
              Back to Support
            </Button>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            {/* Ticket Info */}
            <Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {ticket.subject}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Ticket ID: #{ticket.id} • Category: {getCategoryLabel(ticket.category)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={ticket.status} color={getStatusColor(ticket.status)} />
                    <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Created: {new Date(ticket.created_at).toLocaleString()} • Updated:{' '}
                  {new Date(ticket.updated_at).toLocaleString()}
                </Typography>
              </Paper>

              {/* Messages */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Conversation ({messages.length})
                </Typography>

                {messages.length === 0 ? (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No messages yet. Add a message to get started!
                  </Alert>
                ) : (
                  <Box sx={{ mb: 3, maxHeight: '400px', overflowY: 'auto' }}>
                    {messages.map(msg => (
                      <Card key={msg.id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {msg.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {msg.name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {new Date(msg.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                              <Chip label={msg.role} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                            </Box>
                          </Box>
                          <Typography variant="body2" sx={{ mt: 1, ml: 6 }}>
                            {msg.message}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                {/* Message Input */}
                <Divider sx={{ my: 2 }} />
                {messageFeedback && (
                  <Alert severity={messageFeedback === 'Message sent successfully.' ? 'success' : 'error'} sx={{ mb: 2 }}>
                    {messageFeedback}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value)
                      setMessageError('')
                      setMessageFeedback('')
                    }}
                    onKeyPress={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSendMessage()
                      }
                    }}
                    error={Boolean(messageError)}
                    helperText={messageError || `${newMessage.length}/2000`}
                    multiline
                    maxRows={3}
                    disabled={sending}
                    inputProps={{ maxLength: 2000 }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </Box>
              </Paper>
            </Box>

            {/* Sidebar Info */}
            <Box>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Ticket Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                    <Button
                      key={status}
                      variant={ticket.status === status ? 'contained' : 'outlined'}
                      size="small"
                      fullWidth
                      onClick={() => handleStatusChange(status)}
                      disabled={ticket.status === 'closed'}
                    >
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </Box>
              </Paper>

              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Ticket Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Status
                    </Typography>
                    <Chip label={ticket.status} color={getStatusColor(ticket.status)} sx={{ mt: 0.5, width: '100%' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Priority
                    </Typography>
                    <Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} sx={{ mt: 0.5, width: '100%' }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Category
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                      {getCategoryLabel(ticket.category)}
                    </Typography>
                  </Box>
                  {ticket.assigned_to_name && (
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Assigned To
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {ticket.assigned_to_name}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default TicketDetail
