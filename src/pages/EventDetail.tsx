import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Stack,
  Divider,
  useTheme,
  TextField,
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import PaystackPaymentModal from '../components/PaystackPaymentModal'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DescriptionIcon from '@mui/icons-material/Description'
import ShareIcon from '@mui/icons-material/Share'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface EventData {
  id: number
  name: string
  date: string
  location?: string
  description?: string
  image_url?: string
  status?: string
}

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [event, setEvent] = useState<EventData | null>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qtyMap, setQtyMap] = useState<Record<number, number>>({})
  const [processing, setProcessing] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '' })
  const [registeredQr, setRegisteredQr] = useState<string | null>(null)
  const [registeredToken, setRegisteredToken] = useState<string | null>(null)
  const [shareNotice, setShareNotice] = useState('')
  const publicEventLink = eventId ? `${window.location.origin}/events/public/${encodeURIComponent(eventId)}` : ''
  const buyerEmail = currentUser?.email || registerForm.email

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      setError('')
      if (!eventId) throw new Error('Missing eventId')
      
      // Fetch event details
      const eventResp = await api.get(`/events/${encodeURIComponent(eventId)}`)
      setEvent(eventResp.data)
      
      // Fetch tickets for this event
      const ticketsResp = await api.get(`/events/${encodeURIComponent(eventId)}/tickets`)
      setTickets(ticketsResp.data || [])
      const initial: Record<number, number> = {}
      ;(ticketsResp.data || []).forEach((t: any) => {
        initial[t.id] = 1
      })
      setQtyMap(initial)
    } catch (err: any) {
      console.error('Failed to fetch event details', err)
      const msg = err?.response?.data?.message || err?.message || 'Unknown error'
      setError('Failed to load event: ' + msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!eventId) {
      navigate('/')
      return
    }
    
    // Load current user
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr)
        setCurrentUser(parsed)
        setRegisterForm((prev) => ({
          name: prev.name || parsed?.name || '',
          email: prev.email || parsed?.email || '',
          phone: prev.phone || '',
        }))
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }
    
    fetchEventDetails()
  }, [eventId, navigate])

  const handlePurchase = (ticketId: number) => {
    if (!currentUser) {
      const trimmedName = registerForm.name.trim()
      const trimmedEmail = registerForm.email.trim().toLowerCase()
      if (!trimmedName || !trimmedEmail) {
        setError('Please enter your name and email to purchase tickets.')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        setError('Please enter a valid email address.')
        return
      }
    }

    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return

    const qty = qtyMap[ticketId] || 1
    const totalAmount = (ticket.price || 0) * qty

    setSelectedTicketId(ticketId)
    setPaymentAmount(totalAmount)
    setPaymentOpen(true)
  }

  const handlePaymentSuccess = async (reference: string) => {
    try {
      setProcessing(true)
      const qty = qtyMap[selectedTicketId!] || 1
      
      // Complete purchase after payment verification
      const resp = await api.post(`/events/${eventId}/purchase`, {
        ticket_id: selectedTicketId,
        quantity: qty,
        payment_method: 'paystack',
        payment_reference: reference,
        name: currentUser ? undefined : registerForm.name,
        email: currentUser ? undefined : registerForm.email,
        phone: currentUser ? undefined : registerForm.phone,
      })
      
      setMessage(`Purchase successful — ${resp.data.transactionId} — ₵${resp.data.amount}`)
      setPaymentOpen(false)
      fetchEventDetails()
      setTimeout(() => setMessage(''), 4000)
    } catch (err: any) {
      console.error('Purchase completion failed', err)
      setError(err.response?.data?.message || 'Failed to complete purchase')
      setTimeout(() => setError(''), 4000)
    } finally {
      setProcessing(false)
    }
  }

  const handleRegister = async () => {
    if (!eventId) return
    try {
      setRegistering(true)
      setError('')
      setMessage('')
      setRegisteredQr(null)
      setRegisteredToken(null)

      const resp = await api.post(`/events/${eventId}/attend`, {
        name: registerForm.name,
        email: registerForm.email,
        phone: registerForm.phone,
      })

      setMessage(resp.data?.message || 'Registration successful')
      setRegisteredQr(resp.data?.qr || null)
      setRegisteredToken(resp.data?.token || null)
      setTimeout(() => setMessage(''), 5000)
    } catch (err: any) {
      console.error('Registration failed', err)
      setError(err?.response?.data?.message || 'Failed to register')
      setTimeout(() => setError(''), 5000)
    } finally {
      setRegistering(false)
    }
  }

  const handleCopyLink = async () => {
    if (!publicEventLink) return
    try {
      await navigator.clipboard.writeText(publicEventLink)
      setShareNotice('Public event link copied to clipboard.')
      setTimeout(() => setShareNotice(''), 3000)
    } catch {
      setShareNotice(publicEventLink)
      setTimeout(() => setShareNotice(''), 5000)
    }
  }

  const handleShare = async () => {
    if (!event || !publicEventLink) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: `Join this event: ${event.name}`,
          url: publicEventLink,
        })
        return
      } catch {
        // fallback to copy link
      }
    }
    await handleCopyLink()
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    )

  if (error && !event)
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
          Go Back
        </Button>
        <Alert severity="error">{error}</Alert>
      </Container>
    )

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        {/* Top Actions */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Events
          </Button>
          <Button variant="outlined" startIcon={<ShareIcon />} onClick={handleShare}>
            Share Event
          </Button>
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={handleCopyLink}>
            Copy Link
          </Button>
        </Stack>

        {/* Event Image & Details Card */}
        {event && (
          <Card
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'light'
                ? '0 8px 32px rgba(65, 73, 88, 0.18)'
                : '0 8px 32px rgba(0, 0, 0, 0.4)',
              mb: 4,
              border: theme.palette.mode === 'light'
                ? '1px solid rgba(204, 213, 226, 0.24)'
                : '1px solid rgba(204, 213, 226, 0.18)',
            }}
          >
            {/* Event Image */}
            {event.image_url ? (
              <CardMedia
                component="img"
                height={400}
                image={event.image_url}
                alt={event.name}
                sx={{
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Box
                sx={{
                  height: 400,
                  background: theme.palette.mode === 'light' ? '#EEF2F8' : '#232B38',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DescriptionIcon sx={{ fontSize: 80, opacity: 0.3 }} />
              </Box>
            )}

            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Stack spacing={3}>
                {/* Title */}
                <Box>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      color: '#414958',
                      mb: 1,
                    }}
                  >
                    {event.name}
                  </Typography>
                  {event.status && (
                    <Chip
                      label={event.status}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(65, 73, 88, 0.18)',
                        color: '#414958',
                        fontWeight: 700,
                        border: '1.5px solid #CCD5E2',
                      }}
                    />
                  )}
                </Box>

                {/* Event Info Grid */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                  }}
                >
                  {/* Date */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      background: theme.palette.mode === 'light'
                        ? 'rgba(65, 73, 88, 0.06)'
                        : 'rgba(204, 213, 226, 0.07)',
                      border: theme.palette.mode === 'light'
                        ? '1px solid rgba(65, 73, 88, 0.12)'
                        : '1px solid rgba(204, 213, 226, 0.12)',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <CalendarMonthIcon sx={{ color: '#414958' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#414958' }}>
                        Date & Time
                      </Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {new Intl.DateTimeFormat(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(event.date))}
                    </Typography>
                  </Box>

                  {/* Location */}
                  {event.location && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: theme.palette.mode === 'light'
                          ? 'rgba(65, 73, 88, 0.06)'
                          : 'rgba(204, 213, 226, 0.07)',
                        border: theme.palette.mode === 'light'
                          ? '1px solid rgba(65, 73, 88, 0.12)'
                          : '1px solid rgba(204, 213, 226, 0.12)',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <LocationOnIcon sx={{ color: '#414958' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#414958' }}>
                          Location
                        </Typography>
                      </Stack>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {event.location}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Description */}
                {event.description && (
                  <>
                    <Divider />
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 1,
                          color: theme.palette.text.primary,
                        }}
                      >
                        About This Event
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          lineHeight: 1.8,
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {event.description}
                      </Typography>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {message && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {shareNotice && (
          <Alert severity="info" sx={{ mb: 3 }} onClose={() => setShareNotice('')}>
            {shareNotice}
          </Alert>
        )}

        {/* Registration Section (No Signup Required) */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: '#414958',
            }}
          >
            Register for This Event
          </Typography>
          <Paper
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: '16px',
              background: theme.palette.mode === 'light' ? '#FFFFFF' : '#2D3645',
              border: theme.palette.mode === 'light'
                ? '1px solid rgba(204, 213, 226, 0.24)'
                : '1px solid rgba(204, 213, 226, 0.18)',
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No signup required. We will email your confirmation and QR check-in code.
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
              <TextField
                label="Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, email: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Phone (optional)"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, phone: e.target.value }))}
                fullWidth
              />
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleRegister}
                disabled={registering}
                sx={{
                  backgroundColor: '#414958',
                  fontWeight: 700,
                  '&:hover': {
                    backgroundColor: '#2B3240',
                  },
                }}
              >
                {registering ? 'Registering...' : 'Register Now'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                Want a paid ticket? Use the ticket options below (sign-in required).
              </Typography>
            </Stack>
            {(registeredToken || registeredQr) && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(65, 73, 88, 0.06)' }}>
                {registeredToken && (
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Your check-in token: {registeredToken}
                  </Typography>
                )}
                {registeredQr && (
                  <Box
                    component="img"
                    src={registeredQr}
                    alt="Registration QR"
                    sx={{ mt: 1, maxWidth: 220, borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}
                  />
                )}
              </Box>
            )}
          </Paper>
        </Box>

        {/* Tickets Section */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 3,
              color: '#414958',
            }}
          >
            Available Tickets
          </Typography>

          {tickets.length === 0 ? (
            <Paper
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: '16px',
                background: theme.palette.mode === 'light' ? '#FFFFFF' : '#2D3645',
                border: theme.palette.mode === 'light'
                  ? '1px solid rgba(204, 213, 226, 0.24)'
                  : '1px solid rgba(204, 213, 226, 0.18)',
              }}
            >
              <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
                No tickets available for this event yet.
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gap: 2 }}>
              {tickets.map((ticket) => (
                <Paper
                  key={ticket.id}
                  sx={{
                    p: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '12px',
                    background: theme.palette.mode === 'light' ? '#FFFFFF' : '#2D3645',
                    border: theme.palette.mode === 'light'
                      ? '1px solid rgba(204, 213, 226, 0.24)'
                      : '1px solid rgba(204, 213, 226, 0.18)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 8px 24px rgba(65, 73, 88, 0.14)'
                        : '0 8px 24px rgba(0, 0, 0, 0.3)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {ticket.ticket_type}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Price: ${ticket.price} • Available: {ticket.quantity - ticket.sold}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Select
                      value={qtyMap[ticket.id] || 1}
                      size="small"
                      onChange={(e) =>
                        setQtyMap((prev) => ({
                          ...prev,
                          [ticket.id]: Number(e.target.value),
                        }))
                      }
                      sx={{
                        minWidth: 80,
                        borderRadius: '8px',
                      }}
                    >
                      {Array.from({
                        length: Math.max(1, ticket.quantity - ticket.sold || 1),
                      }).map((_, i) => (
                        <MenuItem key={i} value={i + 1}>
                          {i + 1}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      onClick={() => handlePurchase(ticket.id)}
                      disabled={processing || (ticket.quantity - ticket.sold) <= 0}
                      sx={{
                        backgroundColor: '#414958',
                        fontWeight: 700,
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          backgroundColor: '#2B3240',
                          boxShadow: '0 8px 24px rgba(65, 73, 88, 0.3)',
                        },
                      }}
                    >
                      {processing ? 'Processing…' : 'Buy'}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Paystack Payment Modal */}
        <PaystackPaymentModal
          open={paymentOpen}
          amount={paymentAmount}
          email={buyerEmail || ''}
          title="Purchase Event Ticket"
          description={`Complete your purchase for ${event?.name}`}
          metadata={{
            eventId: event?.id,
            ticketId: selectedTicketId,
            eventName: event?.name,
          }}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentOpen(false)}
          onError={(err) => {
            setError(`Payment error: ${err.message}`)
            setTimeout(() => setError(''), 4000)
          }}
        />
      </Container>
    </Box>
  )
}

export default EventDetail

