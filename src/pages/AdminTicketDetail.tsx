import React, { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import SendIcon from '@mui/icons-material/Send'
import BackIcon from '@mui/icons-material/ArrowBack'
import DashboardSidebar from '../components/DashboardSidebar'
import api from '../api'
import { getCategoryLabel } from '../constants/support'

interface TicketMessage {
  id: number
  message: string
  created_at: string
  user_id: number
  name: string
  role: string
}

interface AdminTicketDetailRecord {
  id: number
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  user_name: string
  user_email?: string
  assigned_to_name?: string
  created_at: string
  updated_at: string
}

const AdminTicketDetail: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticket, setTicket] = useState<AdminTicketDetailRecord | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/signin')
      return
    }

    const parsedUser = JSON.parse(userStr)
    if (parsedUser.role !== 'admin') {
      navigate('/signin')
      return
    }

    setUser(parsedUser)
    void fetchTicketDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, navigate])

  const fetchTicketDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/admin/support/tickets/${ticketId}`)
      setTicket(response.data.ticket)
      setMessages(response.data.messages || [])
    } catch (requestError) {
      console.error('Failed to fetch admin ticket:', requestError)
      setError('Failed to load ticket details.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      await api.post(`/admin/support/tickets/${ticketId}/messages`, {
        message: newMessage,
      })
      setNewMessage('')
      await fetchTicketDetail()
    } catch (requestError) {
      console.error('Failed to send admin ticket message:', requestError)
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (nextStatus: AdminTicketDetailRecord['status']) => {
    try {
      setUpdatingStatus(true)
      await api.put(`/admin/support/tickets/${ticketId}/status`, { status: nextStatus })
      await fetchTicketDetail()
    } catch (requestError) {
      console.error('Failed to update admin ticket status:', requestError)
      setError('Failed to update ticket status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
      open: 'info',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'default',
    }
    return colors[status] || 'default'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {user && (
        <DashboardSidebar
          userRole="admin"
          userName={user.name || 'Admin User'}
          userEmail={user.email || 'admin@huzz.com'}
          userImage={user.profile_image}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/support-tickets')} variant="text">
              Back to Admin Tickets
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {!ticket ? (
            <Alert severity="warning">Ticket not found.</Alert>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
              <Box>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, gap: 2 }}>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        {ticket.subject}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Ticket ID: #{ticket.id} • Category: {getCategoryLabel(ticket.category)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                    Created: {new Date(ticket.created_at).toLocaleString()} • Updated: {new Date(ticket.updated_at).toLocaleString()}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Conversation ({messages.length})
                  </Typography>

                  {messages.length === 0 ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      No messages yet. Add an admin update to start the thread.
                    </Alert>
                  ) : (
                    <Box sx={{ mb: 3, maxHeight: 420, overflowY: 'auto' }}>
                      {messages.map((message) => (
                        <Card key={message.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {message.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {message.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {new Date(message.created_at).toLocaleString()}
                                  </Typography>
                                </Box>
                                <Chip label={message.role} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                              </Box>
                            </Box>
                            <Typography variant="body2" sx={{ mt: 1, ml: 6 }}>
                              {message.message}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Write an internal support response..."
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      multiline
                      maxRows={4}
                      disabled={sending}
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

              <Box>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Ticket Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {['open', 'in_progress', 'resolved', 'closed'].map((statusOption) => (
                      <Button
                        key={statusOption}
                        variant={ticket.status === statusOption ? 'contained' : 'outlined'}
                        size="small"
                        fullWidth
                        onClick={() => handleStatusChange(statusOption as AdminTicketDetailRecord['status'])}
                        disabled={updatingStatus}
                      >
                        {statusOption.replace('_', ' ').charAt(0).toUpperCase() + statusOption.slice(1)}
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
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Submitted By
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {ticket.user_name}
                      </Typography>
                      {ticket.user_email && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {ticket.user_email}
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Assigned To
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
                        {ticket.assigned_to_name || 'Unassigned'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AdminTicketDetail
