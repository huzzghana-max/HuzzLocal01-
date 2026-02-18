import React, { useEffect, useState } from 'react'
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
  Tabs,
  Tab,
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

const EventRegistrantsAndTickets: React.FC = () => {
  const [tabValue, setTabValue] = useState(0) // 0: Registrants, 1: Tickets
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

  const handleExportRegistrants = () => {
    const exportList = selectedEventId === 'all' ? registrants : registrants.filter((r) => r.event_id === selectedEventId)
    const csv = [
      ['Name', 'Email', 'Phone', 'Event', 'Date', 'Location', 'Token', 'Registered'],
      ...exportList.map((r) => [
        r.name,
        r.email,
        r.phone,
        r.event_name,
        new Date(r.event_date).toLocaleString(),
        r.location,
        r.token,
        new Date(r.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'registrants.csv'
    a.click()
  }

  const handleExportTickets = () => {
    const exportList = selectedEventId === 'all' ? tickets : tickets.filter((t) => t.event_id === selectedEventId)
    const csv = [
      ['Buyer', 'Email', 'Event', 'Date', 'Ticket Type', 'Quantity', 'Amount', 'Payment', 'Validated', 'Date'],
      ...exportList.map((t) => [
        t.buyer_name,
        t.buyer_email,
        t.event_name,
        new Date(t.event_date).toLocaleString(),
        t.ticket_type,
        t.quantity,
        `$${t.amount.toFixed(2)}`,
        t.payment_method,
        t.validated ? 'Yes' : 'No',
        new Date(t.created_at).toLocaleString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ticket-sales.csv'
    a.click()
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
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
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v as number)} sx={{ mb: 3 }}>
            <Tab label={`Registrants (${registrants.length})`} />
            <Tab label={`Ticket Sales (${tickets.length})`} />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
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
                    <MenuItem key={ev.id} value={ev.id}>{ev.name} — {new Date(ev.date).toLocaleDateString()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {tabValue === 0 ? (
            <Paper>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Event Registrants</Typography>
                <Button startIcon={<FileDownloadIcon />} onClick={handleExportRegistrants} size="small">
                  Export CSV
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.paper' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Event Date</TableCell>
                      <TableCell>Token</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registrants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="textSecondary" sx={{ py: 3 }}>
                            No registrants yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      registrants.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.email}</TableCell>
                          <TableCell>{r.phone}</TableCell>
                          <TableCell>{r.event_name}</TableCell>
                          <TableCell>{new Date(r.event_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip label={r.token} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              startIcon={<QrCode2Icon />}
                              size="small"
                              onClick={() => {
                                setSelectedQr(JSON.stringify({ eventId: r.event_id, token: r.token }))
                                setQrDialogOpen(true)
                              }}
                            >
                              QR
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper>
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="h6">Ticket Sales</Typography>
                  {tickets.length > 0 && (
                    <Typography variant="subtitle2" color="success.main">
                      Total Revenue: $
                      {tickets.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
                    </Typography>
                  )}
                </Stack>
                <Button startIcon={<FileDownloadIcon />} onClick={handleExportTickets} size="small">
                  Export CSV
                </Button>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.paper' }}>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell>Ticket Type</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="center">Verified</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          <Typography color="textSecondary" sx={{ py: 3 }}>
                            No ticket sales yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{t.buyer_name}</TableCell>
                          <TableCell>{t.buyer_email}</TableCell>
                          <TableCell>{t.event_name}</TableCell>
                          <TableCell>{t.ticket_type}</TableCell>
                          <TableCell align="center">{t.quantity}</TableCell>
                          <TableCell align="right">${t.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip label={t.payment_method} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            {t.validated ? (
                              <Chip label="Verified" color="success" size="small" />
                            ) : (
                              <Chip label="Pending" color="warning" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
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
