import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import QrCode2Icon from '@mui/icons-material/QrCode2'
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
  buyer_id: number
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
  buyer_name: string
  buyer_email: string
}

type AttendeeType = 'all' | 'registration' | 'ticket'

interface UnifiedAttendee {
  id: string
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

const EventRegistrantsAndTickets: React.FC = () => {
  const [attendeeType, setAttendeeType] = useState<AttendeeType>('all')
  const [registrants, setRegistrants] = useState<Registrant[]>([])
  const [tickets, setTickets] = useState<TicketSale[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | 'all'>('all')

  const [loading, setLoading] = useState(true)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedQr, setSelectedQr] = useState<string | null>(null)

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

  useEffect(() => {
    fetchEvents()
    fetchLists('all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchLists(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

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
      type: 'ticket',
      name: t.buyer_name,
      email: t.buyer_email,
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
    if (attendeeType === 'all') return unifiedAttendees
    return unifiedAttendees.filter((attendee) => attendee.type === attendeeType)
  }, [unifiedAttendees, attendeeType])

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Event', 'Event Date', 'Type', 'Details', 'Amount', 'Payment', 'Status/Token', 'Created'],
      ...filteredAttendees.map((item) => [
        item.name,
        item.email,
        item.eventName,
        new Date(item.eventDate).toLocaleString(),
        item.type === 'registration' ? 'Registration' : 'Ticket',
        item.details,
        item.amount ? `$${item.amount.toFixed(2)}` : '-',
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

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <DashboardHeader title="Registrants & Tickets" />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 320 }}>
                  <InputLabel id="event-filter-label">Event</InputLabel>
                  <Select
                    labelId="event-filter-label"
                    value={selectedEventId}
                    label="Event"
                    onChange={(e) => setSelectedEventId(e.target.value as number | 'all')}
                  >
                    <MenuItem value={'all'}>All events</MenuItem>
                    {events.map((ev) => (
                      <MenuItem key={ev.id} value={ev.id}>{ev.name} - {new Date(ev.date).toLocaleDateString()}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1}>
                  <Chip clickable color={attendeeType === 'all' ? 'primary' : 'default'} label={`All (${unifiedAttendees.length})`} onClick={() => setAttendeeType('all')} />
                  <Chip clickable color={attendeeType === 'registration' ? 'primary' : 'default'} label={`Registrations (${registrants.length})`} onClick={() => setAttendeeType('registration')} />
                  <Chip clickable color={attendeeType === 'ticket' ? 'primary' : 'default'} label={`Ticket Sales (${tickets.length})`} onClick={() => setAttendeeType('ticket')} />
                </Stack>
              </Box>

              <Paper>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={2}>
                    <Typography variant="h6">Attendees</Typography>
                    {tickets.length > 0 && (
                      <Typography variant="subtitle2" color="success.main">
                        Revenue: ${tickets.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
                      </Typography>
                    )}
                  </Stack>
                  <Button startIcon={<FileDownloadIcon />} onClick={handleExport} size="small">
                    Export CSV
                  </Button>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.paper' }}>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Event</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Details</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell>Status / Token</TableCell>
                        <TableCell>Event Date</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAttendees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography color="textSecondary" sx={{ py: 3 }}>
                              No attendees found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendees.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.email}</TableCell>
                            <TableCell>{item.eventName}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                color={item.type === 'registration' ? 'info' : 'secondary'}
                                label={item.type === 'registration' ? 'Registration' : 'Ticket'}
                              />
                            </TableCell>
                            <TableCell>{item.details}</TableCell>
                            <TableCell>
                              {item.type === 'ticket' ? `$${(item.amount || 0).toFixed(2)} - ${item.paymentMethod || '-'}` : '-'}
                            </TableCell>
                            <TableCell>
                              {item.type === 'registration' ? (
                                <Chip label={item.token || '-'} size="small" variant="outlined" />
                              ) : item.validated ? (
                                <Chip label="Verified" color="success" size="small" />
                              ) : (
                                <Chip label="Pending" color="warning" size="small" />
                              )}
                            </TableCell>
                            <TableCell>{new Date(item.eventDate).toLocaleDateString()}</TableCell>
                            <TableCell align="right">
                              {item.type === 'registration' ? (
                                <Button
                                  startIcon={<QrCode2Icon />}
                                  size="small"
                                  onClick={() => {
                                    setSelectedQr(JSON.stringify({ eventId: item.eventId, token: item.token }))
                                    setQrDialogOpen(true)
                                  }}
                                >
                                  QR
                                </Button>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Container>
      </Box>

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {selectedQr && (
            <Typography variant="body2" color="textSecondary">
              {selectedQr}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default EventRegistrantsAndTickets
