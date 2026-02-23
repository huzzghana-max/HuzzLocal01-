import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  Chip,
} from '@mui/material'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import AssignmentIcon from '@mui/icons-material/Assignment'
import PendingIcon from '@mui/icons-material/Pending'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PaymentIcon from '@mui/icons-material/Payment'
import DashboardSidebar from '../../components/DashboardSidebar'
import { DashboardHeader, StatCard } from '../../components/DashboardComponents'
import api from '../../api'

interface User {
  id: number
  name: string
  email: string
  role: 'organizer' | 'provider' | 'admin'
  profile_image?: string
}

interface BookingItem {
  id: number
  status?: string
  booking_date?: string
  amount?: string | number
  price?: string | number
  title?: string
  service_title?: string
}

const CHART_COLORS = ['#0E3B26', '#F5A623', '#2E7D32', '#D32F2F', '#5C6BC0', '#78909C']

const ProviderAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<BookingItem[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/signin')
      return
    }
    const parsed = JSON.parse(userStr) as User
    if (parsed.role !== 'provider') {
      navigate('/signin')
      return
    }
    setUser(parsed)
    void fetchAnalytics()
  }, [navigate])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/signin')
        return
      }

      const bookingsResponse = await api.get('/provider-bookings', { headers: { Authorization: `Bearer ${token}` } })
      const normalized = (bookingsResponse.data || []).map((booking: any) => ({
        ...booking,
        service_title: booking.service_title || booking.title,
        amount: booking.amount ?? booking.price ?? 0,
      }))
      setBookings(normalized)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const bookingStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    bookings.forEach((booking) => {
      const key = (booking.status || 'unknown').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [bookings])

  const monthlyBookingData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString('default', { month: 'short' }),
        bookings: 0,
        completed: 0,
        earnings: 0,
      }
    })
    const monthIndex = new Map(months.map((month) => [month.key, month]))

    bookings.forEach((booking) => {
      const date = new Date(booking.booking_date || '')
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthIndex.get(key)
      if (bucket) {
        bucket.bookings += 1
        if ((booking.status || '').toLowerCase() === 'completed') {
          bucket.completed += 1
          bucket.earnings += Number(booking.amount || 0) || 0
        }
      }
    })

    return months
  }, [bookings])

  const topServicesData = useMemo(() => {
    const counts: Record<string, number> = {}
    bookings.forEach((booking) => {
      const name = booking.service_title || 'Unknown Service'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [bookings])

  const stats = useMemo(() => {
    const pendingRequests = bookings.filter((booking) => booking.status === 'pending').length
    const confirmedJobs = bookings.filter((booking) => booking.status === 'confirmed').length
    const completedJobs = bookings.filter((booking) => booking.status === 'completed').length
    const rejectedJobs = bookings.filter((booking) => booking.status === 'rejected').length
    const totalEarnings = bookings
      .filter((booking) => booking.status === 'completed')
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0)
    const openDecisions = pendingRequests + confirmedJobs + completedJobs + rejectedJobs
    const acceptanceRate = openDecisions > 0 ? Math.round(((confirmedJobs + completedJobs) / openDecisions) * 100) : 0
    const completionRate = bookings.length > 0 ? Math.round((completedJobs / bookings.length) * 100) : 0
    const avgJobValue = completedJobs > 0 ? (totalEarnings / completedJobs).toFixed(2) : '0.00'

    return {
      pendingRequests,
      confirmedJobs,
      completedJobs,
      totalEarnings: totalEarnings.toFixed(2),
      acceptanceRate,
      completionRate,
      avgJobValue,
      activePipeline: pendingRequests + confirmedJobs,
    }
  }, [bookings])

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="provider"
        userName={user?.name || 'Provider'}
        userEmail={user?.email || ''}
        userImage={user?.profile_image}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <DashboardHeader title="Provider Analytics" subtitle="Track bookings, service demand, and earnings performance" />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && !error && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
                <StatCard title="Total Bookings" value={bookings.length} icon={<AssignmentIcon />} color="primary" />
                <StatCard title="Pending Requests" value={stats?.pendingRequests || 0} icon={<PendingIcon />} color="warning" />
                <StatCard title="Completed Jobs" value={stats?.completedJobs || 0} icon={<CheckCircleIcon />} color="success" />
                <StatCard title="Total Earnings" value={`$${stats?.totalEarnings || 0}`} icon={<PaymentIcon />} color="secondary" />
                <StatCard title="Active Pipeline" value={stats?.activePipeline || 0} icon={<PendingIcon />} color="info" />
                <StatCard title="Acceptance Rate" value={`${stats?.acceptanceRate || 0}%`} icon={<CheckCircleIcon />} color="primary" />
                <StatCard title="Completion Rate" value={`${stats?.completionRate || 0}%`} icon={<CheckCircleIcon />} color="success" />
                <StatCard title="Avg Job Value" value={`$${stats?.avgJobValue || '0.00'}`} icon={<PaymentIcon />} color="warning" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Booking Status Breakdown</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bookingStatusData} dataKey="value" nameKey="name" outerRadius={100} label>
                          {bookingStatusData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Top Services by Bookings</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topServicesData} layout="vertical" margin={{ left: 24, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Bar dataKey="total" fill="#1B5E3C" name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>

              <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>6-Month Booking Volume</Typography>
                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyBookingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#0E3B26" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Earnings Trend (6 Months)</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyBookingData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="earnings" stroke="#2E7D32" strokeWidth={2.5} name="Earnings ($)" />
                        <Line type="monotone" dataKey="completed" stroke="#0E3B26" strokeWidth={2.5} name="Completed Jobs" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Top Service Demand Snapshot</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {topServicesData.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No service demand data available.</Typography>
                    )}
                    {topServicesData.map((service) => (
                      <Chip key={service.name} label={`${service.name} (${service.total})`} color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              </Box>
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default ProviderAnalytics
