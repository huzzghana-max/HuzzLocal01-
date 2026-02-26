import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Skeleton,
  Stack,
  Tooltip,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Select,
  MenuItem,
} from '@mui/material'
import api from '../api'
import PaystackPaymentModal from '../components/PaystackPaymentModal'
import { useNavigate } from 'react-router-dom'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NearMeIcon from '@mui/icons-material/NearMe'

type EventItem = {
  id: number
  name: string
  date: string
  location?: string
  lat?: number
  lng?: number
  image_url?: string
  description?: string
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const EventsNearYou: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [visibleCount, setVisibleCount] = useState(9)
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: 'success' | 'error' | 'info' }>(
    { open: false }
  )
  const [attendDialog, setAttendDialog] = useState<{
    open: boolean
    event: EventItem | null
    name: string
    email: string
    phone: string
    tickets: Array<{ id: number; ticket_type: string; price: number; quantity: number; sold: number }>
    selectedTicketId: number | ''
    quantity: number
    loading: boolean
  }>({
    open: false,
    event: null,
    name: '',
    email: '',
    phone: '',
    tickets: [],
    selectedTicketId: '',
    quantity: 1,
    loading: false,
  })
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true

    const fetchEvents = async () => {
      try {
        setLoading(true)
        const resp = await api.get('/events/public')
        if (!mounted) return
        setEvents(Array.isArray(resp.data) ? resp.data : [])
      } catch (err) {
        console.error(err)
        setError('Could not load events')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchEvents()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // ignore errors - we still show events unsorted
      },
      { maximumAge: 1000 * 60 * 5, timeout: 5000 }
    )

    return () => {
      // nothing to clean up for getCurrentPosition
    }
  }, [])

  const enriched = useMemo(() => {
    if (!coords) return events.map((e) => ({ ...e, _distance: undefined }))
    return events.map((e) => {
      if (typeof e.lat === 'number' && typeof e.lng === 'number') {
        // @ts-ignore add transient prop
        return { ...e, _distance: haversineDistance(coords.lat, coords.lng, e.lat, e.lng) }
      }
      // @ts-ignore
      return { ...e, _distance: undefined }
    })
  }, [events, coords])

  const sorted = useMemo(() => {
    return [...enriched].sort((a: any, b: any) => {
      if (a._distance == null && b._distance == null) return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (a._distance == null) return 1
      if (b._distance == null) return -1
      return a._distance - b._distance
    })
  }, [enriched])

  const handleAttend = async (ev: EventItem) => {
    let tickets: Array<{ id: number; ticket_type: string; price: number; quantity: number; sold: number }> = []
    try {
      const resp = await api.get(`/events/${ev.id}/tickets`)
      tickets = Array.isArray(resp.data) ? resp.data : []
    } catch {
      tickets = []
    }
    const firstAvailable = tickets.find((t) => (t.quantity || 0) - (t.sold || 0) > 0)
    setAttendDialog({
      open: true,
      event: ev,
      name: '',
      email: '',
      phone: '',
      tickets,
      selectedTicketId: firstAvailable ? firstAvailable.id : '',
      quantity: 1,
      loading: false,
    })
  }

  const submitAttend = async () => {
    if (!attendDialog.event) return
    try {
      setAttendDialog((s) => ({ ...s, loading: true }))
      const resp = await api.post(`/events/${attendDialog.event.id}/attend`, {
        name: attendDialog.name,
        email: attendDialog.email,
        phone: attendDialog.phone,
        ticket_id: attendDialog.selectedTicketId || undefined,
        quantity: attendDialog.quantity,
        payment_method: 'offline',
      })
      setAttendDialog((s) => ({ ...s, open: false, loading: false }))
      setSnack({
        open: true,
        message:
          resp.data?.mode === 'ticket'
            ? `Ticket purchased successfully (${resp.data?.transactionId || 'tx created'})`
            : resp.data?.message || 'Registered',
        severity: 'success',
      })
    } catch (err: any) {
      console.error(err)
      setSnack({
        open: true,
        message: err?.response?.data?.message || 'Unable to complete request',
        severity: 'error',
      })
      setAttendDialog((s) => ({ ...s, loading: false }))
    }
  }

  if (loading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )

  if (error)
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Container>
    )

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background:
          'radial-gradient(circle at 0% -10%, rgba(93,214,44,0.14) 0%, transparent 42%), radial-gradient(circle at 100% 0%, rgba(51,116,24,0.12) 0%, transparent 38%)',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1.5}
          sx={{ mb: 3 }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.6,
              fontSize: { xs: '2rem', md: '2.6rem' },
              background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Events Near You
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {coords ? 'Sorted by distance' : 'Sorting by date'}
            </Typography>
            <Tooltip title="Refresh">
              <Button
                onClick={() => window.location.reload()}
                size="small"
                sx={{
                  color: 'primary.main',
                  fontWeight: 600,
                  borderRadius: 2,
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                Refresh
              </Button>
            </Tooltip>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
          }}
        >
          {sorted.slice(0, visibleCount).map((ev: any, idx: number) => (
            <Box key={`${ev.id}-${idx}`}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  overflow: 'hidden',
                  backdropFilter: 'blur(6px)',
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.96) 0%, rgba(244,247,246,0.92) 100%)',
                  boxShadow: '0 10px 26px rgba(14, 59, 38, 0.12)',
                  border: '1px solid rgba(207,217,211,0.8)',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    boxShadow: '0 18px 36px rgba(14, 59, 38, 0.18)',
                    transform: 'translateY(-6px)',
                    border: '1px solid rgba(14, 59, 38, 0.28)',
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  {ev.image_url ? (
                    <CardMedia component="img" height={180} image={ev.image_url} alt={ev.name} />
                  ) : (
                    <Skeleton variant="rectangular" height={180} />
                  )}
                  <Chip
                    icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                    label={new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(ev.date))}
                    size="small"
                    sx={{
                      position: 'absolute',
                      left: 12,
                      bottom: 12,
                      bgcolor: 'rgba(255,255,255,0.95)',
                      fontWeight: 700,
                      border: '1px solid rgba(14,59,38,0.16)',
                    }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                  <Stack spacing={0.8}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#0E3B26',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {ev.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {new Intl.DateTimeFormat(undefined, {
                        weekday: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(new Date(ev.date))}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                        label={ev.location || 'Location TBD'}
                        variant="outlined"
                        sx={{
                          maxWidth: '100%',
                          borderColor: 'divider',
                          '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
                        }}
                      />
                      {ev._distance != null && (
                        <Chip
                          size="small"
                          icon={<NearMeIcon sx={{ fontSize: 15 }} />}
                          label={`${(ev._distance as number).toFixed(1)} km away`}
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                    {ev.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ev.description}
                      </Typography>
                    )}
                  </Stack>
                  <Divider sx={{ mt: 'auto' }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 0.6 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => navigate(`/events/${ev.id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #145A45 0%, #0F4333 100%)',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(14, 59, 38, 0.3)',
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleAttend(ev)}
                      sx={{
                        borderColor: '#0E3B26',
                        color: '#0E3B26',
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 2,
                        border: '2px solid',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'rgba(14, 59, 38, 0.08)',
                          borderColor: '#1B5E3C',
                        },
                      }}
                    >
                      Attend Event
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        {sorted.length === 0 && (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No events found.
            </Typography>
          </Box>
        )}

        {sorted.length > visibleCount && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              variant="contained"
              onClick={() => setVisibleCount((c) => c + 9)}
              sx={{
                background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                fontWeight: 700,
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(14, 59, 38, 0.3)',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(14, 59, 38, 0.4)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Load more
            </Button>
          </Box>
        )}
      <Dialog open={attendDialog.open} onClose={() => setAttendDialog((s) => ({ ...s, open: false }))} fullWidth maxWidth="sm">
        <DialogTitle>Attend Event</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'grid', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {attendDialog.event?.name}
            </Typography>
            {attendDialog.tickets.length > 0 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Choose a ticket to buy (requires sign-in), or choose register-only.
                </Typography>
                <Select
                  value={attendDialog.selectedTicketId}
                  onChange={(e) => setAttendDialog((s) => ({ ...s, selectedTicketId: e.target.value as number | '' }))}
                  fullWidth
                >
                  <MenuItem value="">Register only (no ticket)</MenuItem>
                  {attendDialog.tickets.map((t) => {
                    const available = Math.max(0, (t.quantity || 0) - (t.sold || 0))
                    return (
                      <MenuItem key={t.id} value={t.id} disabled={available <= 0}>
                        {t.ticket_type} - ${t.price} ({available} left)
                      </MenuItem>
                    )
                  })}
                </Select>
                {attendDialog.selectedTicketId && (
                  <TextField
                    label="Quantity"
                    type="number"
                    value={attendDialog.quantity}
                    inputProps={{ min: 1 }}
                    onChange={(e) => setAttendDialog((s) => ({ ...s, quantity: Math.max(1, Number(e.target.value) || 1) }))}
                    fullWidth
                  />
                )}
              </>
            )}
            {!attendDialog.selectedTicketId && (
              <>
                <TextField label="Name" value={attendDialog.name} onChange={(e) => setAttendDialog((s) => ({ ...s, name: e.target.value }))} fullWidth />
                <TextField label="Email" value={attendDialog.email} onChange={(e) => setAttendDialog((s) => ({ ...s, email: e.target.value }))} fullWidth />
                <TextField label="Phone" value={attendDialog.phone} onChange={(e) => setAttendDialog((s) => ({ ...s, phone: e.target.value }))} fullWidth />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendDialog((s) => ({ ...s, open: false }))}>Cancel</Button>
          <Button variant="contained" onClick={submitAttend} disabled={attendDialog.loading}>
            {attendDialog.loading ? 'Processing...' : attendDialog.selectedTicketId ? 'Buy & Attend' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ open: false })}>
        <Alert onClose={() => setSnack({ open: false })} severity={snack.severity || 'info'} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  )
}

export default EventsNearYou

