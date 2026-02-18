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
} from '@mui/material'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import DescriptionIcon from '@mui/icons-material/Description'

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
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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
    fetchEventDetails()
  }, [eventId, navigate])

  const handlePurchase = async (ticketId: number) => {
    try {
      setProcessing(true)
      const qty = qtyMap[ticketId] || 1
      const resp = await api.post(`/events/${eventId}/purchase`, {
        ticket_id: ticketId,
        quantity: qty,
        payment_method: 'offline',
      })
      setMessage(`Purchase successful — ${resp.data.transactionId} — $${resp.data.amount}`)
      fetchEventDetails()
      setTimeout(() => setMessage(''), 4000)
    } catch (err: any) {
      console.error('Purchase failed', err)
      setError(err.response?.data?.message || 'Purchase failed')
      setTimeout(() => setError(''), 4000)
    } finally {
      setProcessing(false)
    }
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
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
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

        {/* Event Image & Details Card */}
        {event && (
          <Card
            sx={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'light'
                ? '0 8px 32px rgba(14, 59, 38, 0.15)'
                : '0 8px 32px rgba(0, 0, 0, 0.4)',
              mb: 4,
              border: theme.palette.mode === 'light'
                ? '1px solid rgba(184, 227, 197, 0.2)'
                : '1px solid rgba(184, 227, 197, 0.15)',
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
                  background: theme.palette.mode === 'light'
                    ? 'linear-gradient(135deg, #F4F7F6 0%, #B8E3C5 100%)'
                    : 'linear-gradient(135deg, #0E2620 0%, #1B5E3C 100%)',
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
                      background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
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
                        background: 'linear-gradient(135deg, rgba(14, 59, 38, 0.15) 0%, rgba(184, 227, 197, 0.15) 100%)',
                        color: '#0E3B26',
                        fontWeight: 700,
                        border: '1.5px solid #B8E3C5',
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
                        ? 'rgba(14, 59, 38, 0.05)'
                        : 'rgba(184, 227, 197, 0.05)',
                      border: theme.palette.mode === 'light'
                        ? '1px solid rgba(14, 59, 38, 0.1)'
                        : '1px solid rgba(184, 227, 197, 0.1)',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <CalendarMonthIcon sx={{ color: '#0E3B26' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0E3B26' }}>
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
                          ? 'rgba(14, 59, 38, 0.05)'
                          : 'rgba(184, 227, 197, 0.05)',
                        border: theme.palette.mode === 'light'
                          ? '1px solid rgba(14, 59, 38, 0.1)'
                          : '1px solid rgba(184, 227, 197, 0.1)',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <LocationOnIcon sx={{ color: '#0E3B26' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0E3B26' }}>
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

        {/* Tickets Section */}
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
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
                background: theme.palette.mode === 'light'
                  ? 'linear-gradient(135deg, #FFFFFF 0%, #F4F7F6 100%)'
                  : 'linear-gradient(135deg, #122A1F 0%, #0E2620 100%)',
                border: theme.palette.mode === 'light'
                  ? '1px solid rgba(184, 227, 197, 0.2)'
                  : '1px solid rgba(184, 227, 197, 0.15)',
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
                    background: theme.palette.mode === 'light'
                      ? 'linear-gradient(135deg, #FFFFFF 0%, #F4F7F6 100%)'
                      : 'linear-gradient(135deg, #122A1F 0%, #0E2620 100%)',
                    border: theme.palette.mode === 'light'
                      ? '1px solid rgba(184, 227, 197, 0.2)'
                      : '1px solid rgba(184, 227, 197, 0.15)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      boxShadow: theme.palette.mode === 'light'
                        ? '0 8px 24px rgba(14, 59, 38, 0.12)'
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
                        background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                        fontWeight: 700,
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(14, 59, 38, 0.3)',
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
      </Container>
    </Box>
  )
}

export default EventDetail
