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
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined'
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
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

const statCards = [
  {
    key: 'attendees',
    label: 'Total Attendees',
    icon: <PeopleAltOutlinedIcon fontSize="small" />,
    color: 'primary.main',
  },
  {
    key: 'sales',
    label: 'Ticket Sales',
    icon: <ConfirmationNumberOutlinedIcon fontSize="small" />,
    color: 'secondary.main',
  },
  {
    key: 'revenue',
    label: 'Revenue',
    icon: <PaidOutlinedIcon fontSize="small" />,
    color: 'success.main',
  },
  {
    key: 'verified',
    label: 'Verified Tickets',
    icon: <EventAvailableOutlinedIcon fontSize="small" />,
    color: 'info.main',
  },
] as const

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

  const totalRevenue = useMemo(() => {
    return tickets.reduce((sum, t) => {
      const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount || 0
      return sum + (Number.isNaN(amount) ? 0 : amount)
    }, 0)
  }, [tickets])

  const verifiedTickets = useMemo(() => tickets.filter((t) => t.validated).length, [tickets])

  const stats = {
    attendees: unifiedAttendees.length,
    sales: tickets.length,
    revenue: totalRevenue,
    verified: verifiedTickets,
  }

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
        <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                {statCards.map((card) => (
                  <Grid item xs={12} sm={6} lg={3} key={card.key}>
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        borderColor: (theme) => alpha(theme.palette.divider, 0.8),
                        boxShadow: (theme) => `0 12px 24px ${alpha(theme.palette.common.black, 0.08)}`,
                      }}
                    >
                      <CardContent sx={{ p: 2.2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {card.label}
                          </Typography>
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 2,
                              display: 'grid',
                              placeItems: 'center',
                              color: card.color,
                              bgcolor: (theme) => alpha(theme.palette[card.color.split('.')[0] as 'primary' | 'secondary' | 'success' | 'info'].main, 0.12),
                            }}
                          >
                            {card.icon}
                          </Box>
                        </Stack>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {card.key === 'revenue' ? `$${stats.revenue.toFixed(2)}` : stats[card.key]}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Paper sx={{ p: 2.2, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} gap={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 350 } }}>
                      <InputLabel id="event-filter-label">Event</InputLabel>
                      <Select
                        labelId="event-filter-label"
                        value={selectedEventId}
                        label="Event"
                        onChange={(e) => setSelectedEventId(e.target.value as number | 'all')}
                      >
                        <MenuItem value={'all'}>All events</MenuItem>
                        {events.map((ev) => (
                          <MenuItem key={ev.id} value={ev.id}>
                            {ev.name} - {new Date(ev.date).toLocaleDateString()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        clickable
                        color={attendeeType === 'all' ? 'primary' : 'default'}
                        variant={attendeeType === 'all' ? 'filled' : 'outlined'}
                        label={`All (${unifiedAttendees.length})`}
                        onClick={() => setAttendeeType('all')}
                      />
                      <Chip
                        clickable
                        color={attendeeType === 'registration' ? 'primary' : 'default'}
                        variant={attendeeType === 'registration' ? 'filled' : 'outlined'}
                        label={`Registrations (${registrants.length})`}
                        onClick={() => setAttendeeType('registration')}
                      />
                      <Chip
                        clickable
                        color={attendeeType === 'ticket' ? 'primary' : 'default'}
                        variant={attendeeType === 'ticket' ? 'filled' : 'outlined'}
                        label={`Ticket Sales (${tickets.length})`}
                        onClick={() => setAttendeeType('ticket')}
                      />
                    </Stack>
                  </Stack>

                  <Button startIcon={<FileDownloadIcon />} onClick={handleExport}>
                    Export CSV
                  </Button>
                </Stack>
              </Paper>

              <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  gap={1}
                  sx={{ px: 2.3, py: 1.8, borderBottom: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}` }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 750 }}>
                    Attendee List
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Showing {filteredAttendees.length} records
                  </Typography>
                </Stack>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Event</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status / Token</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Event Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAttendees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.6 }}>
                              No attendees found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Try selecting another event or filter.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAttendees.map((item) => (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{
                              '&:nth-of-type(even)': {
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.018),
                              },
                              '& td': {
                                py: 1.15,
                              },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
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
                              {item.type === 'ticket'
                                ? `$${(typeof (item.amount || 0) === 'string' ? parseFloat(item.amount || '0') : item.amount || 0).toFixed(2)} - ${item.paymentMethod || '-'}`
                                : '-'}
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
                            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
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
            </Stack>
          )}
        </Container>
      </Box>

      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>QR Code</DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {selectedQr && (
            <Typography variant="body2" color="text.secondary">
              {selectedQr}
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default EventRegistrantsAndTickets
