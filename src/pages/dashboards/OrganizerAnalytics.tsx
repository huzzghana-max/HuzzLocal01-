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
import EventIcon from '@mui/icons-material/Event'
import PendingIcon from '@mui/icons-material/Pending'
import PeopleIcon from '@mui/icons-material/People'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
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

interface EventItem {
  id: number
  name: string
  date: string
  status?: string
}

interface BookingItem {
  id: number
  status?: string
  booking_date?: string
  price?: number | string
  amount?: number | string
  title?: string
  service_title?: string
}

const CHART_COLORS = ['#0E3B26', '#F5A623', '#2E7D32', '#D32F2F', '#5C6BC0', '#78909C']

const OrganizerAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/signin')
      return
    }
    const parsed = JSON.parse(userStr) as User
    if (parsed.role !== 'organizer') {
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

      const [statsResponse, bookingsResponse] = await Promise.all([
        api.get('/dashboard/organizer-stats', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/my-bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      setStats(statsResponse.data)
      setEvents(statsResponse.data?.events || [])
      setBookings(bookingsResponse.data || [])
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

  const eventStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    events.forEach((event) => {
      const key = (event.status || 'unknown').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [events])

  const bookingStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    bookings.forEach((booking) => {
      const key = (booking.status || 'unknown').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [bookings])

  const monthlyVolumeData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString('default', { month: 'short' }),
        events: 0,
        bookings: 0,
        completed: 0,
        revenue: 0,
      }
    })

    const monthIndex = new Map(months.map((month) => [month.key, month]))

    events.forEach((event) => {
      const date = new Date(event.date)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthIndex.get(key)
      if (bucket) bucket.events += 1
    })

    bookings.forEach((booking) => {
      const date = new Date(booking.booking_date || '')
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthIndex.get(key)
      if (bucket) {
        bucket.bookings += 1
        if ((booking.status || '').toLowerCase() === 'completed') {
          bucket.completed += 1
          bucket.revenue += Number(booking.amount ?? booking.price ?? 0) || 0
        }
      }
    })

    return months
  }, [events, bookings])

  const organizerMetrics = useMemo(() => {
    const totalEvents = stats?.totalEvents || events.length
    const totalBookings = bookings.length
    const completed = bookings.filter((b) => (b.status || '').toLowerCase() === 'completed').length
    const confirmed = bookings.filter((b) => (b.status || '').toLowerCase() === 'confirmed').length
    const activeClosed = completed + confirmed
    const completionRate = totalBookings > 0 ? Math.round((activeClosed / totalBookings) * 100) : 0
    const avgBookingsPerEvent = totalEvents > 0 ? (totalBookings / totalEvents).toFixed(1) : '0.0'
    const now = new Date()
    const plus30 = new Date(now)
    plus30.setDate(now.getDate() + 30)
    const upcoming30 = events.filter((event) => {
      const date = new Date(event.date)
      return !Number.isNaN(date.getTime()) && date >= now && date <= plus30
    }).length
    return {
      totalBookings,
      completionRate,
      avgBookingsPerEvent,
      upcoming30,
    }
  }, [bookings, events, stats])

  const topDemandServices = useMemo(() => {
    const counts: Record<string, number> = {}
    bookings.forEach((booking) => {
      const key = booking.service_title || booking.title || 'Unknown Service'
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [bookings])

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="organizer"
        userName={user?.name || 'Organizer'}
        userEmail={user?.email || ''}
        userImage={user?.profile_image}
        onLogout={handleLogout}
      />

      <Box sx={{ flex: 1, ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <DashboardHeader title="Organizer Analytics" subtitle="Performance insights for your events and bookings" />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && !error && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
                <StatCard title="Total Events" value={stats?.totalEvents || events.length} icon={<EventIcon />} color="primary" />
                <StatCard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={<PendingIcon />} color="info" />
                <StatCard title="Pending Bookings" value={stats?.pendingBookings || 0} icon={<ReceiptIcon />} color="warning" />
                <StatCard title="Total Vendors" value={stats?.totalVendors || 0} icon={<PeopleIcon />} color="secondary" />
                <StatCard title="Total Bookings" value={organizerMetrics.totalBookings} icon={<ReceiptIcon />} color="success" />
                <StatCard title="Completion Rate" value={`${organizerMetrics.completionRate}%`} icon={<CheckCircleIcon />} color="info" />
                <StatCard title="Avg Bookings/Event" value={organizerMetrics.avgBookingsPerEvent} icon={<PeopleIcon />} color="primary" />
                <StatCard title="Next 30 Days" value={organizerMetrics.upcoming30} icon={<PendingIcon />} color="warning" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Event Status Breakdown</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={eventStatusData} dataKey="value" nameKey="name" outerRadius={100} label>
                          {eventStatusData.map((_, idx) => (
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
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Booking Status Breakdown</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bookingStatusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#1B5E3C" name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>

              <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>6-Month Activity Trend</Typography>
                <Box sx={{ height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="events" fill="#0E3B26" name="Events" />
                      <Bar dataKey="bookings" fill="#F5A623" name="Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mt: 3 }}>
                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Monthly Delivery Momentum</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyVolumeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completed" stroke="#2E7D32" strokeWidth={2.5} name="Completed" />
                        <Line type="monotone" dataKey="bookings" stroke="#0E3B26" strokeWidth={2.5} name="All Bookings" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Top Service Demand</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {topDemandServices.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No service booking data yet.</Typography>
                    )}
                    {topDemandServices.map((item) => (
                      <Chip key={item.name} label={`${item.name} (${item.value})`} color="primary" variant="outlined" />
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

export default OrganizerAnalytics
