import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../components/DashboardSidebar'
import { DashboardHeader } from '../components/DashboardComponents'
import api from '../api'

type PayoutStatus = 'pending' | 'approved' | 'rejected' | 'paid'

interface PayoutRequestItem {
  id: number
  requester_id: number
  requester_role: 'provider' | 'organizer'
  requester_name: string
  requester_email: string
  requester_phone?: string | null
  source_type: 'service_bookings' | 'ticket_sales'
  source_event_id?: number | null
  source_event_name?: string | null
  source_event_date?: string | null
  source_event_location?: string | null
  source_event_type?: string | null
  source_event_status?: string | null
  amount: number
  status: PayoutStatus
  note?: string | null
  admin_note?: string | null
  requested_at: string
  processed_at?: string | null
}

const AdminPayoutRequests: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<PayoutRequestItem[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selected, setSelected] = useState<PayoutRequestItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<PayoutStatus>('approved')
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })()

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/payout-requests')
      setRequests(response.data || [])
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to load payout requests.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!storedUser || storedUser.role !== 'admin') {
      navigate('/signin')
      return
    }
    fetchRequests().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const pending = requests.filter((request) => request.status === 'pending').length
    const approved = requests.filter((request) => request.status === 'approved').length
    const paid = requests.filter((request) => request.status === 'paid').length
    const totalAmount = requests.reduce((sum, request) => sum + Number(request.amount || 0), 0)
    return { pending, approved, paid, totalAmount }
  }, [requests])

  const openReview = (request: PayoutRequestItem) => {
    setSelected(request)
    setNextStatus(request.status === 'pending' ? 'approved' : request.status)
    setAdminNote(request.admin_note || '')
    setDialogOpen(true)
  }

  const submitReview = async () => {
    if (!selected) return
    try {
      setSubmitting(true)
      await api.put(`/admin/payout-requests/${selected.id}`, {
        status: nextStatus,
        admin_note: adminNote.trim() || undefined,
      })
      setMessage({ type: 'success', text: `Payout request #${selected.id} updated.` })
      setDialogOpen(false)
      await fetchRequests()
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.response?.data?.message || 'Failed to update payout request.' })
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor = (status: PayoutStatus) => {
    if (status === 'rejected') return 'error'
    if (status === 'paid') return 'success'
    if (status === 'approved') return 'info'
    return 'warning'
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="admin"
        userName={storedUser?.name || 'Admin'}
        userEmail={storedUser?.email || ''}
        userImage={storedUser?.profile_image}
        onLogout={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/signin')
        }}
      />

      <Box sx={{ flex: 1, ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <DashboardHeader
            title="Payout Requests"
            subtitle="Review and process provider + organizer payout requests"
            actionButton={(
              <Button variant="outlined" onClick={() => fetchRequests()}>
                Refresh
              </Button>
            )}
          />

          {message && (
            <Alert sx={{ mb: 2.5 }} severity={message.type} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              <Paper sx={{ p: 2.2, borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Pending: {stats.pending} | Approved: {stats.approved} | Paid: {stats.paid} | Requested Volume: ${stats.totalAmount.toFixed(2)}
                </Typography>
              </Paper>

              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Requester</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Organizer Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Event Details</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Requested</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Admin Note</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                          No payout requests found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>
                            <Typography sx={{ fontWeight: 600 }}>{request.requester_name}</Typography>
                            <Typography variant="body2" color="text.secondary">{request.requester_email}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {request.requester_role}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              Email: {request.requester_email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Phone: {request.requester_phone || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {request.source_event_name ? (
                              <>
                                <Typography sx={{ fontWeight: 600 }}>{request.source_event_name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Date: {request.source_event_date ? new Date(request.source_event_date).toLocaleString() : '-'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Location: {request.source_event_location || '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {request.source_event_type || 'event'} • {request.source_event_status || 'n/a'}
                                </Typography>
                              </>
                            ) : (
                              <Typography variant="body2" color="text.secondary">No event linked</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ textTransform: 'capitalize' }}>
                              {request.source_type === 'ticket_sales' ? 'Ticket Sales' : 'Service Bookings'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.requester_role === 'organizer' ? 'Organizer request' : 'Provider request'}
                            </Typography>
                          </TableCell>
                          <TableCell>${Number(request.amount || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={request.status} color={statusColor(request.status) as any} />
                          </TableCell>
                          <TableCell>{new Date(request.requested_at).toLocaleString()}</TableCell>
                          <TableCell>{request.admin_note || '-'}</TableCell>
                          <TableCell align="right">
                            <Button size="small" variant="contained" onClick={() => openReview(request)}>
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </Container>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Payout Request</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <Select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as PayoutStatus)} fullWidth>
              <MenuItem value="approved">Approve</MenuItem>
              <MenuItem value="rejected">Reject</MenuItem>
              <MenuItem value="paid">Mark as Paid</MenuItem>
            </Select>
            <TextField
              label="Admin Note (optional)"
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitReview} disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminPayoutRequests
