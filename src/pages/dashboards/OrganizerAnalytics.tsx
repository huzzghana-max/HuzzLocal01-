import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Container,
  CircularProgress,
  Typography,
  Paper,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Gauge } from '@mui/x-charts/Gauge'
import { SparkLineChart } from '@mui/x-charts/SparkLineChart'
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
import PeopleIcon from '@mui/icons-material/People'
import ReceiptIcon from '@mui/icons-material/Receipt'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
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

const CHART_COLORS = ['#2D6CDF', '#00A6A6', '#F4B740', '#E15B64', '#6E56CF', '#5C7C89']

type TimeRange = '3m' | '6m' | '12m' | 'all'

const OrganizerAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [events, setEvents] = useState<EventItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')

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

  const rangeCutoffDate = useMemo(() => {
    if (timeRange === 'all') return null
    const monthsBack = Number(timeRange.replace('m', ''))
    const date = new Date()
    date.setMonth(date.getMonth() - monthsBack)
    return date
  }, [timeRange])

  const filteredEvents = useMemo(() => {
    if (!rangeCutoffDate) return events
    return events.filter((event) => {
      const date = new Date(event.date)
      return !Number.isNaN(date.getTime()) && date >= rangeCutoffDate
    })
  }, [events, rangeCutoffDate])

  const filteredBookings = useMemo(() => {
    if (!rangeCutoffDate) return bookings
    return bookings.filter((booking) => {
      const date = new Date(booking.booking_date || '')
      return !Number.isNaN(date.getTime()) && date >= rangeCutoffDate
    })
  }, [bookings, rangeCutoffDate])

  const bookingStatusData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredBookings.forEach((booking) => {
      const key = (booking.status || 'unknown').toLowerCase()
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredBookings])

  const monthlyVolumeData = useMemo(() => {
    const monthCount = timeRange === 'all' ? 12 : Number(timeRange.replace('m', ''))
    const now = new Date()
    const months = Array.from({ length: monthCount }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - idx), 1)
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

    filteredEvents.forEach((event) => {
      const date = new Date(event.date)
      if (Number.isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const bucket = monthIndex.get(key)
      if (bucket) bucket.events += 1
    })

    filteredBookings.forEach((booking) => {
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
  }, [filteredEvents, filteredBookings, timeRange])

  const metrics = useMemo(() => {
    const totalEvents = filteredEvents.length
    const totalBookings = filteredBookings.length
    const completed = filteredBookings.filter((b) => (b.status || '').toLowerCase() === 'completed').length
    const confirmed = filteredBookings.filter((b) => (b.status || '').toLowerCase() === 'confirmed').length
    const completionRate = totalBookings > 0 ? Math.round(((completed + confirmed) / totalBookings) * 100) : 0
    const avgBookingsPerEvent = totalEvents > 0 ? (totalBookings / totalEvents).toFixed(1) : '0.0'
    const now = new Date()
    const plus30 = new Date(now)
    plus30.setDate(now.getDate() + 30)
    const upcoming30 = filteredEvents.filter((event) => {
      const date = new Date(event.date)
      return !Number.isNaN(date.getTime()) && date >= now && date <= plus30
    }).length
    const totalCompletedRevenue = filteredBookings
      .filter((booking) => (booking.status || '').toLowerCase() === 'completed')
      .reduce((sum, booking) => sum + (Number(booking.amount ?? booking.price ?? 0) || 0), 0)

    return {
      totalEvents,
      totalBookings,
      completionRate,
      avgBookingsPerEvent,
      upcoming30,
      totalCompletedRevenue,
      pendingBookings: filteredBookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length,
    }
  }, [filteredBookings, filteredEvents])

  const topDemandServices = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredBookings.forEach((booking) => {
      const key = booking.service_title || booking.title || 'Unknown Service'
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredBookings])

  const recentBookings = useMemo(() => (
    [...filteredBookings]
      .sort((a, b) => new Date(b.booking_date || 0).getTime() - new Date(a.booking_date || 0).getTime())
      .slice(0, 6)
  ), [filteredBookings])

  const rangeLabel = useMemo(() => {
    if (timeRange === 'all') return 'All Time'
    return `Last ${timeRange.replace('m', '')} Months`
  }, [timeRange])

  const exportSummaryCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Range', rangeLabel],
      ['Total Events', metrics.totalEvents.toString()],
      ['Total Bookings', metrics.totalBookings.toString()],
      ['Completion Rate', `${metrics.completionRate}%`],
      ['Total Revenue (Completed)', metrics.totalCompletedRevenue.toFixed(2)],
      ['Upcoming Next 30 Days', metrics.upcoming30.toString()],
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `organizer-analytics-${timeRange}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const panelSx = {
    p: { xs: 2.5, md: 3 },
    borderRadius: 3,
    border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
    background: theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'light'
      ? `0 10px 24px ${alpha(theme.palette.common.black, 0.06)}`
      : `0 10px 24px ${alpha(theme.palette.common.black, 0.3)}`,
  }

  const sectionTitleSx = { fontWeight: 700, mb: 1.5, fontSize: '0.98rem', letterSpacing: '0.01em' }

  const tooltipStyle = {
    borderRadius: 10,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: alpha(theme.palette.background.paper, 0.95),
  }

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
          <DashboardHeader
            title="Analytics"
            subtitle="Performance overview for events and bookings"
            actionButton={(
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="organizer-range-label">Range</InputLabel>
                  <Select
                    labelId="organizer-range-label"
                    value={timeRange}
                    label="Range"
                    onChange={(event) => setTimeRange(event.target.value as TimeRange)}
                  >
                    <MenuItem value="3m">Last 3 Months</MenuItem>
                    <MenuItem value="6m">Last 6 Months</MenuItem>
                    <MenuItem value="12m">Last 12 Months</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void fetchAnalytics()}>
                  Refresh
                </Button>
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={exportSummaryCsv}>
                  Export CSV
                </Button>
              </Stack>
            )}
          />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {!loading && !error && (
            <>
              <Paper sx={{ ...panelSx, mb: 2.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', mb: 0.5 }}>
                  {rangeLabel} Snapshot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {topDemandServices[0]
                    ? `${topDemandServices[0].name} leads demand, with ${metrics.completionRate}% completion and $${metrics.totalCompletedRevenue.toFixed(2)} completed revenue.`
                    : 'Analytics will appear as event and booking activity grows.'}
                </Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>
                <StatCard title="Events" value={metrics.totalEvents} icon={<EventIcon />} color="primary" />
                <StatCard title="Bookings" value={metrics.totalBookings} icon={<ReceiptIcon />} color="success" />
                <StatCard title="Completion Rate" value={`${metrics.completionRate}%`} icon={<CheckCircleIcon />} color="info" />
                <StatCard title="Revenue" value={`$${metrics.totalCompletedRevenue.toFixed(2)}`} icon={<PeopleIcon />} color="secondary" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' }, gap: 2, mb: 2.5 }}>
                <Paper sx={panelSx}>
                  <Typography sx={sectionTitleSx}>Activity Trend</Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyVolumeData}>
                        <CartesianGrid strokeDasharray="2 5" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                        <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="events" fill={theme.palette.primary.main} name="Events" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="bookings" fill={theme.palette.warning.main} name="Bookings" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={sectionTitleSx}>Booking Status</Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={bookingStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={100}>
                          {bookingStatusData.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 1fr' }, gap: 2, mb: 2.5 }}>
                <Paper sx={panelSx}>
                  <Typography sx={sectionTitleSx}>Completion Gauge</Typography>
                  <Typography variant="body2" color="text.secondary">Confirmed + completed bookings</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Gauge width={180} height={180} value={metrics.completionRate} valueMin={0} valueMax={100} text={({ value }) => `${value}%`} />
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={sectionTitleSx}>Momentum</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Bookings and completions over time</Typography>
                  <SparkLineChart
                    data={monthlyVolumeData.map((item) => item.bookings)}
                    height={110}
                    showTooltip
                    showHighlight
                    curve="monotoneX"
                    color={theme.palette.primary.main}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyVolumeData}>
                        <CartesianGrid strokeDasharray="2 5" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                        <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="completed" stroke={theme.palette.success.main} strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={sectionTitleSx}>Top Services</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {topDemandServices.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No service booking data yet.</Typography>
                    )}
                    {topDemandServices.map((item) => (
                      <Chip key={item.name} label={`${item.name} (${item.value})`} color="primary" variant="outlined" />
                    ))}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending: {metrics.pendingBookings} | Avg bookings per event: {metrics.avgBookingsPerEvent}
                  </Typography>
                </Paper>
              </Box>

              <Paper sx={panelSx}>
                <Typography sx={sectionTitleSx}>Recent Orders</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentBookings.map((booking) => (
                        <TableRow key={booking.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 600 }}>{booking.service_title || booking.title || 'Service'}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{booking.status || 'unknown'}</TableCell>
                          <TableCell>{booking.booking_date ? new Date(booking.booking_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell align="right">${Number(booking.amount ?? booking.price ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {recentBookings.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No bookings yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default OrganizerAnalytics
