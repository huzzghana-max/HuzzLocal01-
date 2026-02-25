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
import AssignmentIcon from '@mui/icons-material/Assignment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PaymentIcon from '@mui/icons-material/Payment'
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

interface BookingItem {
  id: number
  status?: string
  booking_date?: string
  amount?: string | number
  price?: string | number
  title?: string
  service_title?: string
}

const CHART_COLORS = ['#2D6CDF', '#00A6A6', '#F4B740', '#E15B64', '#6E56CF', '#5C7C89']

type TimeRange = '3m' | '6m' | '12m' | 'all'

const ProviderAnalytics: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('6m')

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

  const rangeCutoffDate = useMemo(() => {
    if (timeRange === 'all') return null
    const monthsBack = Number(timeRange.replace('m', ''))
    const date = new Date()
    date.setMonth(date.getMonth() - monthsBack)
    return date
  }, [timeRange])

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

  const monthlyBookingData = useMemo(() => {
    const monthCount = timeRange === 'all' ? 12 : Number(timeRange.replace('m', ''))
    const now = new Date()
    const months = Array.from({ length: monthCount }).map((_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - idx), 1)
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        month: date.toLocaleString('default', { month: 'short' }),
        bookings: 0,
        completed: 0,
        earnings: 0,
      }
    })
    const monthIndex = new Map(months.map((month) => [month.key, month]))

    filteredBookings.forEach((booking) => {
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
  }, [filteredBookings, timeRange])

  const topServicesData = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredBookings.forEach((booking) => {
      const name = booking.service_title || 'Unknown Service'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredBookings])

  const stats = useMemo(() => {
    const pendingRequests = filteredBookings.filter((booking) => booking.status === 'pending').length
    const confirmedJobs = filteredBookings.filter((booking) => booking.status === 'confirmed').length
    const completedJobs = filteredBookings.filter((booking) => booking.status === 'completed').length
    const rejectedJobs = filteredBookings.filter((booking) => booking.status === 'rejected').length
    const totalEarnings = filteredBookings
      .filter((booking) => booking.status === 'completed')
      .reduce((sum, booking) => sum + Number(booking.amount || 0), 0)
    const openDecisions = pendingRequests + confirmedJobs + completedJobs + rejectedJobs

    return {
      pendingRequests,
      confirmedJobs,
      completedJobs,
      rejectedJobs,
      totalEarnings: totalEarnings.toFixed(2),
      acceptanceRate: openDecisions > 0 ? Math.round(((confirmedJobs + completedJobs) / openDecisions) * 100) : 0,
      completionRate: filteredBookings.length > 0 ? Math.round((completedJobs / filteredBookings.length) * 100) : 0,
      avgJobValue: completedJobs > 0 ? (totalEarnings / completedJobs).toFixed(2) : '0.00',
      activePipeline: pendingRequests + confirmedJobs,
    }
  }, [filteredBookings])

  const recentJobs = useMemo(() => (
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
      ['Bookings', filteredBookings.length.toString()],
      ['Pending', stats.pendingRequests.toString()],
      ['Confirmed', stats.confirmedJobs.toString()],
      ['Completed', stats.completedJobs.toString()],
      ['Rejected', stats.rejectedJobs.toString()],
      ['Acceptance Rate', `${stats.acceptanceRate}%`],
      ['Completion Rate', `${stats.completionRate}%`],
      ['Total Earnings', stats.totalEarnings],
      ['Average Job Value', stats.avgJobValue],
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `provider-analytics-${timeRange}-${Date.now()}.csv`
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

  const tooltipStyle = {
    borderRadius: 10,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    background: alpha(theme.palette.background.paper, 0.95),
  }

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
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <DashboardHeader
            title="Analytics Dashboard"
            subtitle="Clean booking, conversion, and earnings overview"
            actionButton={(
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="provider-range-label">Range</InputLabel>
                  <Select
                    labelId="provider-range-label"
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
              <Paper sx={{ ...panelSx, mb: 3 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', mb: 0.5 }}>
                  {rangeLabel} Snapshot
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {topServicesData[0]
                    ? `${topServicesData[0].name} is driving demand. Acceptance is ${stats.acceptanceRate}% and earnings are $${stats.totalEarnings}.`
                    : 'Analytics will populate as you receive booking activity.'}
                </Typography>
              </Paper>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
                <StatCard title="Bookings" value={filteredBookings.length} icon={<AssignmentIcon />} color="primary" />
                <StatCard title="Acceptance Rate" value={`${stats.acceptanceRate}%`} icon={<CheckCircleIcon />} color="info" />
                <StatCard title="Completion Rate" value={`${stats.completionRate}%`} icon={<CheckCircleIcon />} color="success" />
                <StatCard title="Earnings" value={`$${stats.totalEarnings}`} icon={<PaymentIcon />} color="secondary" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '2fr 1fr' }, gap: 2.5, mb: 3 }}>
                <Paper sx={panelSx}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Booking Volume</Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyBookingData}>
                        <CartesianGrid strokeDasharray="2 5" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                        <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="bookings" fill={theme.palette.primary.main} name="Bookings" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="completed" fill={theme.palette.success.main} name="Completed" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Status Mix</Typography>
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

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.2fr 1fr' }, gap: 2.5, mb: 3 }}>
                <Paper sx={panelSx}>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>Acceptance Gauge</Typography>
                  <Typography variant="body2" color="text.secondary">Confirmed + completed decisions</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <Gauge width={180} height={180} value={stats.acceptanceRate} valueMin={0} valueMax={100} text={({ value }) => `${value}%`} />
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>Earnings Momentum</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Compact revenue trend</Typography>
                  <SparkLineChart
                    data={monthlyBookingData.map((item) => item.earnings)}
                    height={110}
                    showTooltip
                    showHighlight
                    curve="monotoneX"
                    color={theme.palette.success.main}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ height: 170 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyBookingData}>
                        <CartesianGrid strokeDasharray="2 5" stroke={alpha(theme.palette.text.secondary, 0.2)} />
                        <XAxis dataKey="month" tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="earnings" stroke={theme.palette.success.main} strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>

                <Paper sx={panelSx}>
                  <Typography sx={{ fontWeight: 700, mb: 2 }}>Top Services</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {topServicesData.length === 0 && (
                      <Typography variant="body2" color="text.secondary">No service demand data available.</Typography>
                    )}
                    {topServicesData.map((service) => (
                      <Chip key={service.name} label={`${service.name} (${service.total})`} color="primary" variant="outlined" />
                    ))}
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Pending: {stats.pendingRequests} | Active pipeline: {stats.activePipeline} | Avg job value: ${stats.avgJobValue}
                  </Typography>
                </Paper>
              </Box>

              <Paper sx={panelSx}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Recent Jobs</Typography>
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
                      {recentJobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{job.service_title || job.title || 'Service'}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{job.status || 'unknown'}</TableCell>
                          <TableCell>{job.booking_date ? new Date(job.booking_date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell align="right">${Number(job.amount ?? job.price ?? 0).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {recentJobs.length === 0 && (
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

export default ProviderAnalytics
