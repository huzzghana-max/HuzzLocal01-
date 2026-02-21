import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Button,
  Typography,
  Paper,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingIcon from '@mui/icons-material/Pending'
import PaymentIcon from '@mui/icons-material/Payment'
import api from '../../api'
import DashboardSidebar from '../../components/DashboardSidebar'
import { StatCard, DashboardHeader } from '../../components/DashboardComponents'

interface User {
  id: number
  name: string
  email: string
  role: string
  profile_image?: string
}

interface Booking {
  id: number
  eventName?: string
  date?: string
  status: 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled'
  amount?: string | number
  service_title?: string
  organizer_name?: string
  booking_date?: string
  notes?: string
  organizer_id?: number
}

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [stats, setStats] = useState<any>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [openDialog, setOpenDialog] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        navigate('/signin')
        return
      }
      const bookingsResponse = await api.get('/provider-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const fetchedBookings = bookingsResponse.data || []
      const transformedBookings = fetchedBookings.map((booking: any) => ({
        id: booking.id,
        service_title: booking.service_title || booking.title,
        organizer_name: booking.organizer_name,
        booking_date: booking.booking_date,
        date: booking.booking_date,
        status: booking.status,
        notes: booking.notes,
        organizer_id: booking.organizer_id,
        amount: booking.amount ?? booking.price ?? 0,
      }))
      setBookings(transformedBookings)
      const totalEarnings = transformedBookings
        .filter((booking: Booking) => booking.status === 'completed')
        .reduce((sum: number, booking: Booking) => sum + Number(booking.amount || 0), 0)
      setStats({
        pendingRequests: transformedBookings.filter((booking: Booking) => booking.status === 'pending').length,
        totalEarnings: totalEarnings.toFixed(2),
      })
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      if (error.response?.status === 401) {
        navigate('/signin')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedBooking(null)
  }

  const handleAcceptBooking = async () => {
    if (selectedBooking) {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          alert('Please login to accept bookings')
          return
        }

        await api.put(
          `/service-bookings/${selectedBooking.id}`,
          { status: 'confirmed' },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        // Update local state
        const updated = bookings.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: 'confirmed' as const } : b
        )
        setBookings(updated)
        handleCloseDialog()
      } catch (error) {
        console.error('Error confirming booking:', error)
        alert('Failed to confirm booking')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const filteredBookings = () => {
    const tab = tabValue
    if (tab === 0) return bookings.filter((b) => b.status === 'pending')
    if (tab === 1) return bookings.filter((b) => b.status === 'confirmed')
    return bookings.filter((b) => b.status === 'completed')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'success'
      default:
        return 'default'
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <DashboardSidebar
        userRole="provider"
        userName={user?.name || 'Service Provider'}
        userEmail={user?.email || 'provider@huzz.com'}
        userImage={user?.profile_image}
        notifications={stats?.pendingRequests || 0}
        messages={0}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Header */}
          <DashboardHeader
            title="Provider Dashboard"
            subtitle="Manage your bookings and service offerings"
            actionButton={
              <Button
                variant="outlined"
                onClick={() => navigate('/vendor-services')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: '#0E3B26',
                  color: '#0E3B26',
                  borderRadius: '12px',
                  border: '2px solid',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#1B5E3C',
                    backgroundColor: 'rgba(14, 59, 38, 0.08)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Manage Services
              </Button>
            }
          />

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {/* Stats Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 5 }}>
                <StatCard title="Total Bookings" value={bookings.length} icon={<AssignmentIcon />} color="primary" change={10} />
                <StatCard title="Pending Requests" value={bookings.filter(b => b.status === 'pending').length} icon={<PendingIcon />} color="warning" change={-3} />
                <StatCard title="Completed" value={bookings.filter(b => b.status === 'completed').length} icon={<CheckCircleIcon />} color="success" change={20} />
                <StatCard title="Total Earnings" value={`$${stats?.totalEarnings || 0}`} icon={<PaymentIcon />} color="secondary" change={8} />
              </Box>

              {/* Bookings Section */}
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Bookings
              </Typography>

              {/* Tabs */}
              <Paper sx={{ mb: 3, borderRadius: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Tab label="Pending Requests" />
                  <Tab label="Confirmed" />
                  <Tab label="Completed" />
                </Tabs>
              </Paper>

              {/* Bookings Table */}
              {filteredBookings().length === 0 ? (
                <Paper
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    borderRadius: 2,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No bookings in this category
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Bookings will appear here once organizers request your services
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(14, 59, 38, 0.1)',
                  border: '1px solid rgba(184, 227, 197, 0.2)',
                }}>
                  <Table>
                    <TableHead sx={{
                      background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                    }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Service</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Organizer</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Booking Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF', textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBookings().map((booking) => (
                        <TableRow
                          key={booking.id}
                          sx={{
                            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              bgcolor: 'rgba(184, 227, 197, 0.1)',
                              boxShadow: '0 2px 8px rgba(14, 59, 38, 0.08) inset',
                            },
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Typography sx={{ fontWeight: 500 }}>{booking.service_title || booking.eventName}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Typography>{booking.organizer_name}</Typography>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {new Date(booking.booking_date || booking.date || '').toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={booking.status}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                background: booking.status === 'pending' 
                                  ? 'rgba(245, 166, 35, 0.2)'
                                  : booking.status === 'confirmed'
                                  ? 'rgba(27, 94, 60, 0.2)'
                                  : 'rgba(107, 114, 128, 0.2)',
                                color: booking.status === 'pending'
                                  ? '#F5A623'
                                  : booking.status === 'confirmed'
                                  ? '#1B5E3C'
                                  : '#6B7280',
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2, textAlign: 'center' }}>
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => handleViewDetails(booking)}
                              sx={{
                                color: '#0E3B26',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  color: '#1B5E3C',
                                  backgroundColor: 'rgba(14, 59, 38, 0.08)',
                                },
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Booking Details Dialog */}
              <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  Booking Details
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {selectedBooking && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Service
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {selectedBooking.service_title || selectedBooking.eventName}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Organizer
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {selectedBooking.organizer_name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Booking Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {new Date(selectedBooking.booking_date || selectedBooking.date || '').toLocaleDateString()}
                        </Typography>
                      </Box>
                      {selectedBooking.notes && (
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            Notes
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 400, color: 'text.secondary' }}>
                            {selectedBooking.notes}
                          </Typography>
                        </Box>
                      )}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                          Status
                        </Typography>
                        <Chip
                          label={selectedBooking.status}
                          color={getStatusColor(selectedBooking.status) as any}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={() => setOpenDialog(false)} sx={{ textTransform: 'none' }}>
                    Close
                  </Button>
                  {selectedBooking?.status === 'pending' && (
                    <Button 
                      variant="contained" 
                      sx={{ textTransform: 'none' }}
                      onClick={handleAcceptBooking}
                    >
                      Accept Booking
                    </Button>
                  )}
                </DialogActions>
              </Dialog>
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default ProviderDashboard
