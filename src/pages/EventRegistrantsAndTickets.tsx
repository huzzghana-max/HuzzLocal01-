import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  IconButton,
  Collapse,
  Menu,
  Avatar,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import api from '../api'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { DashboardHeader } from '../components/DashboardComponents'

interface Registrant {
  id: number
  event_id: number
  name: string
  email: string
  phone: string
  token: string
  created_at: string
  event_name: string
  event_date: string
  location: string
}

interface TicketSale {
  id: number
  ticket_id: number
  buyer_id: number | null
  quantity: number
  amount: number
  transaction_id: string
  payment_method: string
  validated: boolean
  created_at: string
  ticket_type: string
  event_id: number
  event_name: string
  event_date: string
  buyer_name: string | null
  buyer_email: string | null
}

type AttendeeType = 'all' | 'registration' | 'ticket'
type SortOption = 'recent' | 'name_asc' | 'event_asc'

interface UnifiedAttendee {
  id: string
  saleId?: number
  transactionId?: string
  type: 'registration' | 'ticket'
  name: string
  email: string
  eventName: string
  eventDate: string
  createdAt: string
  details: string
  amount?: number
  paymentMethod?: string
  validated?: boolean
  token?: string
  eventId: number
}

interface PayoutSummary {
  totalEarned: number
  totalRequested: number
  available: number
  sourceType: 'service_bookings' | 'ticket_sales'
}

interface PayoutRequest {
  id: number
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  requested_at: string
  source_event_id?: number | null
  source_event_name?: string
}

const EventRegistrantsAndTickets: React.FC = () => {
  const theme = useTheme()
  const [attendeeType, setAttendeeType] = useState<AttendeeType>('all')
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [tickets, setTickets] = useState<TicketSale[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedQr, setSelectedQr] = useState<string | null>(null)
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null)
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutNote, setPayoutNote] = useState('')
  const [payoutSubmitting, setPayoutSubmitting] = useState(false)
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [ticketMessage, setTicketMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [validateDialogOpen, setValidateDialogOpen] = useState(false)
  const [selectedTicketForValidation, setSelectedTicketForValidation] = useState<UnifiedAttendee | null>(null)
  const [validatingTicket, setValidatingTicket] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
  const [menuItem, setMenuItem] = useState<UnifiedAttendee | null>(null)
  const panelSx = {
    borderRadius: 2.5,
    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
    boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.05)}`,
    background: alpha(theme.palette.background.paper, 0.96),
  }

  const navigate = useNavigate()
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch (_) {
      return null
    }
  })()
  const userRole = (storedUser && storedUser.role) || 'organizer'
  const userName = (storedUser && storedUser.name) || ''
  const userEmail = (storedUser && storedUser.email) || ''

  const fetchEvents = async () => {
    try {
      const ev = await api.get('/events')
      setEvents(ev.data || [])
    } catch (e) {
      console.warn('Failed to load events for filter', e)
    }
  }

  const fetchLists = async (eventId: number | 'all') => {
    try {
      setLoading(true)
      const regsUrl = eventId === 'all' ? '/organizer/registrants' : `/organizer/registrants?eventId=${eventId}`
      const salesUrl = eventId === 'all' ? '/organizer/ticket-sales' : `/organizer/ticket-sales?eventId=${eventId}`
      const [registratsRes, ticketsRes] = await Promise.all([api.get(regsUrl), api.get(salesUrl)])
      setRegistrants(registratsRes.data || [])
      setTickets(ticketsRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayoutData = async (eventId: number | 'all') => {
    const summaryUrl = eventId === 'all' ? '/payouts/summary' : `/payouts/summary?eventId=${eventId}`
    const [summaryRes, requestsRes] = await Promise.all([
      api.get(summaryUrl),
      api.get('/payouts/my-requests'),
    ])
    setPayoutSummary(summaryRes.data || null)
    setPayoutRequests(requestsRes.data || [])
  }

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLists(selectedEventId)
    fetchPayoutData(selectedEventId).catch((error) => {
      console.error('Failed to load payout data:', error)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayoutMessage({ type: 'error', text: 'Enter a valid payout amount.' })
      return
    }

    try {
      setPayoutSubmitting(true)
      await api.post('/payouts/request', {
        amount,
        note: payoutNote.trim() || undefined,
        sourceEventId: selectedEventId === 'all' ? undefined : selectedEventId,
      })
      setPayoutMessage({ type: 'success', text: 'Organizer payout request submitted.' })
      setPayoutDialogOpen(false)
      setPayoutAmount('')
      setPayoutNote('')
      await fetchPayoutData(selectedEventId)
    } catch (error: any) {
      setPayoutMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to submit payout request.',
      })
    } finally {
      setPayoutSubmitting(false)
    }
  }

  const unifiedAttendees = useMemo<UnifiedAttendee[]>(() => {
    const registrationRows: UnifiedAttendee[] = registrants.map((r) => ({
      id: `reg-${r.id}`,
      type: 'registration',
      name: r.name,
      email: r.email,
      eventName: r.event_name,
      eventDate: r.event_date,
      createdAt: r.created_at,
      details: r.phone || '-',
      token: r.token,
      eventId: r.event_id,
    }))

    const ticketRows: UnifiedAttendee[] = tickets.map((t) => ({
      id: `tkt-${t.id}`,
      saleId: t.id,
      transactionId: t.transaction_id,
      type: 'ticket',
      name: t.buyer_name || 'Guest Ticket Buyer',
      email: t.buyer_email || 'N/A',
      eventName: t.event_name,
      eventDate: t.event_date,
      createdAt: t.created_at,
      details: `${t.ticket_type} x${t.quantity}`,
      amount: t.amount,
      paymentMethod: t.payment_method,
      validated: t.validated,
      eventId: t.event_id,
    }))

    return [...registrationRows, ...ticketRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [registrants, tickets])

  const filteredAttendees = useMemo(() => {
    let filtered = attendeeType === 'all'
      ? unifiedAttendees
      : unifiedAttendees.filter((attendee) => attendee.type === attendeeType)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((attendee) =>
        attendee.name.toLowerCase().includes(q) ||
        attendee.email.toLowerCase().includes(q) ||
        attendee.eventName.toLowerCase().includes(q),
      )
    }

    return filtered
  }, [unifiedAttendees, attendeeType, searchQuery])

  const displayedAttendees = useMemo(() => {
    const rows = [...filteredAttendees]
    if (sortBy === 'name_asc') {
      rows.sort((a, b) => a.name.localeCompare(b.name))
      return rows
    }
    if (sortBy === 'event_asc') {
      rows.sort((a, b) => a.eventName.localeCompare(b.eventName))
      return rows
    }
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return rows
  }, [filteredAttendees, sortBy])

  const totalRevenue = useMemo(() => {
    return tickets.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount || 0
      return sum + (Number.isNaN(amount) ? 0 : amount)
    }, 0)
  }, [tickets])

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Event', 'Event Date', 'Type', 'Details', 'Amount', 'Payment', 'Status/Token', 'Created'],
      ...displayedAttendees.map((item) => [
        item.name,
        item.email,
        item.eventName,
        new Date(item.eventDate).toLocaleString(),
        item.type === 'registration' ? 'Registration' : 'Ticket',
        item.details,
        item.amount ? `$${(typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount).toFixed(2)}` : '-',
        item.paymentMethod || '-',
        item.type === 'registration' ? item.token || '-' : item.validated ? 'Verified' : 'Pending',
        new Date(item.createdAt).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendees.csv'
    a.click()
  }

  const openValidateDialog = (item: UnifiedAttendee) => {
    setSelectedTicketForValidation(item)
    setValidateDialogOpen(true)
  }

  const handleValidateTicket = async () => {
    if (!selectedTicketForValidation?.eventId || !selectedTicketForValidation?.saleId) {
      setTicketMessage({ type: 'error', text: 'Missing ticket reference for validation.' })
      setValidateDialogOpen(false)
      return
    }

    try {
      setValidatingTicket(true)
      await api.post(`/events/${selectedTicketForValidation.eventId}/validate`, {
        saleId: selectedTicketForValidation.saleId,
      })
      setTicketMessage({ type: 'success', text: 'Ticket validated successfully.' })
      setValidateDialogOpen(false)
      setSelectedTicketForValidation(null)
      await fetchLists(selectedEventId)
    } catch (error: any) {
      setTicketMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Failed to validate ticket.',
      })
    } finally {
      setValidatingTicket(false)
    }
  }

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setTicketMessage({ type: 'success', text: `${label} copied.` })
    } catch {
      setTicketMessage({ type: 'error', text: `Failed to copy ${label.toLowerCase()}.` })
    }
  }

  const toggleRowDetails = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const openRowMenu = (event: React.MouseEvent<HTMLElement>, item: UnifiedAttendee) => {
    setMenuAnchorEl(event.currentTarget)
    setMenuItem(item)
  }

  const closeRowMenu = () => {
    setMenuAnchorEl(null)
    setMenuItem(null)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: alpha(theme.palette.background.default, 0.95) }}>
      <DashboardSidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        userImage={(storedUser && storedUser.profile_image) || ''}
        messages={0}
        onLogout={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/signin')
        }}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 }, overflowX: 'hidden' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
          <DashboardHeader
            title="Registrants & Tickets"
            subtitle="Monitor attendee flow, validate check-ins, and manage ticket payouts"
            actionButton={(
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button variant="contained" onClick={() => setPayoutDialogOpen(true)} sx={{ textTransform: 'none' }}>
                  Request Payout
                </Button>
                <Button startIcon={<FileDownloadIcon />} variant="outlined" onClick={handleExport} sx={{ textTransform: 'none' }}>
                  Export CSV
                </Button>
              </Stack>
            )}
          />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
              <Stack spacing={2.25}>
                {payoutMessage && (
                  <Alert severity={payoutMessage.type} onClose={() => setPayoutMessage(null)} sx={{ borderRadius: 2 }}>
                    {payoutMessage.text}
                  </Alert>
                )}
                {ticketMessage && (
                  <Alert severity={ticketMessage.type} onClose={() => setTicketMessage(null)} sx={{ borderRadius: 2 }}>
                    {ticketMessage.text}
                  </Alert>
                )}

                <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 1.8 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Attendees: <strong>{unifiedAttendees.length}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Ticket Sales: <strong>{tickets.length}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revenue: <strong>${totalRevenue.toFixed(2)}</strong>
                    </Typography>
                  </Stack>
                </Paper>

                {/* Payout Section - Streamlined */}
                <Paper sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} gap={2}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.08rem' } }}>
                        Payout Summary
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.6, sm: 2 }} sx={{ mt: 1.1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Available: <strong>${Number(payoutSummary?.available || 0).toFixed(2)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Requested: <strong>${Number(payoutSummary?.totalRequested || 0).toFixed(2)}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Revenue: <strong>${totalRevenue.toFixed(2)}</strong>
                        </Typography>
                      </Stack>
                    </Box>
                    <Button
                      variant="outlined"
                      onClick={() => setPayoutDialogOpen(true)}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: { xs: 'flex-start', md: 'center' } }}
                    >
                      Request Payout
                    </Button>
                  </Stack>

                  <Box sx={{ mt: 2, pt: 1.6, borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}` }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.45 }}>
                      RECENT REQUESTS
                    </Typography>
                    <Stack spacing={0.8} sx={{ mt: 0.8 }}>
                      {payoutRequests.slice(0, 2).map((request) => (
                        <Box
                          key={request.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            py: 0.7,
                            px: 1,
                            borderRadius: 1.5,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ${Number(request.amount || 0).toFixed(2)} • {new Date(request.requested_at).toLocaleDateString()}
                            {request.source_event_name ? ` • ${request.source_event_name}` : ''}
                          </Typography>
                          <Chip
                            size="small"
                            label={request.status}
                            color={request.status === 'rejected' ? 'error' : request.status === 'paid' ? 'success' : 'warning'}
                            sx={{ borderRadius: 1 }}
                          />
                        </Box>
                      ))}
                      {payoutRequests.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No payout requests yet.
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Paper>

                {/* Filters and Actions - Consolidated Header */}
                <Paper sx={{ ...panelSx, p: { xs: 2, md: 2.5 } }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: 0.6 }}>
                    FILTERS
                  </Typography>
                  <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} gap={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Event</InputLabel>
                        <Select
                          value={selectedEventId}
                          label="Event"
                          onChange={(e) => setSelectedEventId(e.target.value as number | 'all')}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value={'all'}>All Events</MenuItem>
                          {events.map((ev) => (
                            <MenuItem key={ev.id} value={ev.id}>
                              {ev.name} - {new Date(ev.date).toLocaleDateString()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <TextField
                        size="small"
                        placeholder="Search attendee, email, or event..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ minWidth: { xs: '100%', sm: 240 }, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel>Sort</InputLabel>
                        <Select
                          value={sortBy}
                          label="Sort"
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="recent">Most Recent</MenuItem>
                          <MenuItem value="name_asc">Name A-Z</MenuItem>
                          <MenuItem value="event_asc">Event A-Z</MenuItem>
                        </Select>
                      </FormControl>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip
                          clickable
                          color={attendeeType === 'all' ? 'primary' : 'default'}
                          variant={attendeeType === 'all' ? 'filled' : 'outlined'}
                          label={`All (${unifiedAttendees.length})`}
                          onClick={() => setAttendeeType('all')}
                          sx={{ borderRadius: 2 }}
                        />
                        <Chip
                          clickable
                          color={attendeeType === 'registration' ? 'primary' : 'default'}
                          variant={attendeeType === 'registration' ? 'filled' : 'outlined'}
                          label={`Registrations (${registrants.length})`}
                          onClick={() => setAttendeeType('registration')}
                          sx={{ borderRadius: 2 }}
                        />
                        <Chip
                          clickable
                          color={attendeeType === 'ticket' ? 'primary' : 'default'}
                          variant={attendeeType === 'ticket' ? 'filled' : 'outlined'}
                          label={`Tickets (${tickets.length})`}
                          onClick={() => setAttendeeType('ticket')}
                          sx={{ borderRadius: 2 }}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Attendee Directory */}
                <Paper sx={{ ...panelSx, overflow: 'hidden' }}>
                  <Box sx={{ px: 2.5, py: 1.8, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', md: '1.08rem' } }}>
                        Attendee Directory
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {displayedAttendees.length} records
                      </Typography>
                    </Stack>
                  </Box>
                  {displayedAttendees.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        No Attendees Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your filters.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: { xs: 1, md: 1.15 } }}>
                      <Stack spacing={0.85}>
                        {displayedAttendees.map((item) => (
                          <Paper
                            key={item.id}
                            variant="outlined"
                            sx={{
                              p: 1.1,
                              borderRadius: 1.75,
                              borderColor: alpha(theme.palette.divider, 0.62),
                              bgcolor: alpha(theme.palette.background.paper, 0.98),
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: `0 2px 10px ${alpha(theme.palette.common.black, 0.06)}`,
                              },
                            }}
                          >
                            <Stack spacing={0.85}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
                                  <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', bgcolor: alpha(theme.palette.primary.main, 0.14), color: theme.palette.primary.main }}>
                                    {item.name?.charAt(0)?.toUpperCase() || 'A'}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0, maxWidth: { xs: '100%', lg: 360 } }}>
                                    <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>{item.name}</Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>{item.email}</Typography>
                                    <Typography variant="caption" color="text.secondary" noWrap>{item.eventName}</Typography>
                                  </Box>
                                </Stack>

                                <Stack direction="row" spacing={0.6} alignItems="center" flexShrink={0} sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  <Chip size="small" color={item.type === 'registration' ? 'info' : 'secondary'} label={item.type === 'registration' ? 'Registration' : 'Ticket'} />
                                  {item.type === 'registration' ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<QrCode2Icon />}
                                      onClick={() => {
                                        setSelectedQr(JSON.stringify({ eventId: item.eventId, token: item.token }))
                                        setQrDialogOpen(true)
                                      }}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      QR
                                    </Button>
                                  ) : item.validated ? (
                                    <Chip size="small" color="success" label="Validated" />
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="success"
                                      startIcon={<CheckCircleOutlineIcon />}
                                      onClick={() => openValidateDialog(item)}
                                      sx={{ textTransform: 'none' }}
                                    >
                                      Validate
                                    </Button>
                                  )}
                                  <IconButton size="small" onClick={(event) => openRowMenu(event, item)}>
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton size="small" onClick={() => toggleRowDetails(item.id)}>
                                    {expandedRows[item.id] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                  </IconButton>
                                </Stack>
                              </Stack>

                              <Collapse in={!!expandedRows[item.id]}>
                                <Box
                                  sx={{
                                    mt: 0.2,
                                    p: 1,
                                    borderRadius: 1.25,
                                    bgcolor: alpha(theme.palette.background.default, 0.45),
                                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                  }}
                                >
                                  <Stack spacing={0.55}>
                                    <Typography variant="body2" color="text.secondary">
                                      Event Date: {new Date(item.eventDate).toLocaleDateString()} • Joined: {new Date(item.createdAt).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Access: {item.details}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {item.type === 'ticket' ? `Payment: $${Number(item.amount ?? 0).toFixed(2)} • ${item.paymentMethod || '-'}` : item.token ? `Token: ${item.token}` : 'No token'}
                                    </Typography>
                                    {item.transactionId && (
                                      <Typography variant="caption" color="text.secondary">
                                        Transaction: {item.transactionId}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              </Collapse>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Paper>
              </Stack>
          )}
        </Container>
      </Box>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={closeRowMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {menuItem?.type === 'registration' && menuItem?.token && (
          <MenuItem
            onClick={() => {
              void copyToClipboard(menuItem.token || '', 'Token')
              closeRowMenu()
            }}
          >
            Copy Token
          </MenuItem>
        )}
        {menuItem?.type === 'ticket' && menuItem?.transactionId && (
          <MenuItem
            onClick={() => {
              void copyToClipboard(menuItem.transactionId || '', 'Transaction ID')
              closeRowMenu()
            }}
          >
            Copy Transaction ID
          </MenuItem>
        )}
        {menuItem?.email && (
          <MenuItem
            onClick={() => {
              void copyToClipboard(menuItem.email, 'Email')
              closeRowMenu()
            }}
          >
            Copy Email
          </MenuItem>
        )}
      </Menu>

      {/* Payout Dialog - Enhanced */}
      <Dialog open={payoutDialogOpen} onClose={() => setPayoutDialogOpen(false)} maxWidth="sm" fullWidth sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Payout</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Available: ${Number(payoutSummary?.available || 0).toFixed(2)}
          </Typography>
          {selectedEventId !== 'all' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Scoped to selected event.
            </Typography>
          )}
          <Stack spacing={2}>
            <TextField
              label="Amount"
              type="number"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Note (Optional)"
              value={payoutNote}
              onChange={(e) => setPayoutNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPayoutDialogOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleRequestPayout} disabled={payoutSubmitting} sx={{ borderRadius: 2 }}>
            {payoutSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Dialog - Simplified */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          {selectedQr && (
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {selectedQr}
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={validateDialogOpen}
        onClose={() => setValidateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Validate Ticket</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Confirm check-in for <strong>{selectedTicketForValidation?.name || 'this attendee'}</strong>?
          </Typography>
          {selectedTicketForValidation?.transactionId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Transaction: {selectedTicketForValidation.transactionId}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setValidateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleValidateTicket}
            disabled={validatingTicket}
            startIcon={<CheckCircleOutlineIcon />}
          >
            {validatingTicket ? 'Validating...' : 'Confirm Validation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EventRegistrantsAndTickets
