import React, { useEffect, useState, useCallback } from 'react'
import { Box, CircularProgress, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import DashboardSidebar from '../../components/DashboardSidebar'
import { DashboardHeader } from '../../components/DashboardComponents'
import { DashboardReportSection } from '../../components/DashboardReportSection'
import type { GeneratedReport, ReportFilter, ReportOption } from '../../components/DashboardReportSection'
import api from '../../api'

interface User {
  id: number
  name: string
  email: string
  role: string
  profile_image?: string
}

interface Booking {
  id: number
  status: 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled'
  amount?: string | number
  service_title?: string
  organizer_name?: string
  booking_date?: string
  is_guest_booking?: boolean
}

interface PayoutSummary {
  available: number
}

interface PayoutRequest {
  id: number
}

const providerReportTypes: ReportOption[] = [
  { value: 'booking-pipeline', label: 'Booking Pipeline', description: 'Monitor pending, confirmed, completed, and cancelled booking flow.' },
  { value: 'earnings', label: 'Earnings', description: 'Summarize delivered work, payout availability, and completed-booking revenue.' },
  { value: 'client-activity', label: 'Client Activity', description: 'See which organizers are most active and where repeat work is happening.' },
  { value: 'service-performance', label: 'Service Performance', description: 'Compare booking volume across the provider’s services.' },
]

const providerReportFilters: ReportFilter[] = [
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Pending', value: 'pending' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Rejected', value: 'rejected' },
    ],
  },
  {
    key: 'clientType',
    label: 'Client Type',
    options: [
      { label: 'All Clients', value: 'all' },
      { label: 'Registered Organizers', value: 'registered' },
      { label: 'Guest Bookings', value: 'guest' },
    ],
  },
]

// Utility function for date range filtering
const matchesDateRange = (value: string | undefined, dateFrom: string, dateTo: string): boolean => {
  if (!value) return true
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return true
  if (dateFrom) {
    const from = new Date(dateFrom)
    from.setHours(0, 0, 0, 0)
    if (date < from) return false
  }
  if (dateTo) {
    const to = new Date(dateTo)
    to.setHours(23, 59, 59, 999)
    if (date > to) return false
  }
  return true
}

// Individual report builders for better organization
const buildBookingPipelineReport = (
  bookings: Booking[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedStatus = filters.status || 'all'
  const clientType = filters.clientType || 'all'
  const filteredBookings = bookings.filter((booking) => {
    const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus
    const clientMatches =
      clientType === 'all' ||
      (clientType === 'guest' && booking.is_guest_booking) ||
      (clientType === 'registered' && !booking.is_guest_booking)
    return statusMatches && clientMatches && matchesDateRange(booking.booking_date, dateFrom, dateTo)
  })
  const completedBookings = filteredBookings.filter((booking) => booking.status === 'completed')
  const pendingBookings = filteredBookings.filter((booking) => booking.status === 'pending')
  const confirmedBookings = filteredBookings.filter((booking) => booking.status === 'confirmed')

  return {
    title: 'Provider Booking Pipeline Report',
    subtitle: 'Operational overview of the provider booking funnel.',
    summaries: [
      { label: 'Total Bookings', value: filteredBookings.length, helper: 'All bookings in this report range' },
      { label: 'Pending', value: pendingBookings.length, helper: 'Awaiting provider action' },
      { label: 'Confirmed', value: confirmedBookings.length, helper: 'Scheduled and accepted work' },
      { label: 'Completed', value: completedBookings.length, helper: 'Already delivered bookings' },
    ],
    columns: [
      { key: 'service', label: 'Service' },
      { key: 'client', label: 'Client' },
      { key: 'date', label: 'Booking Date' },
      { key: 'status', label: 'Status' },
      { key: 'amount', label: 'Amount' },
    ],
    rows: filteredBookings.map((booking) => ({
      service: booking.service_title || 'Service',
      client: booking.organizer_name || 'Guest',
      date: new Date(booking.booking_date || '').toLocaleDateString(),
      status: booking.status,
      amount: `$${Number(booking.amount || 0).toFixed(2)}`,
    })),
    insights: [
      `${pendingBookings.length} requests are still open in the pipeline.`,
      `${confirmedBookings.length} bookings are currently confirmed.`,
      `${completedBookings.length} jobs have been completed in the selected range.`,
    ],
  }
}

const buildEarningsReport = (
  bookings: Booking[],
  payoutSummary: PayoutSummary | null,
  payoutRequests: PayoutRequest[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedStatus = filters.status || 'all'
  const clientType = filters.clientType || 'all'
  const filteredBookings = bookings.filter((booking) => {
    const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus
    const clientMatches =
      clientType === 'all' ||
      (clientType === 'guest' && booking.is_guest_booking) ||
      (clientType === 'registered' && !booking.is_guest_booking)
    return statusMatches && clientMatches && matchesDateRange(booking.booking_date, dateFrom, dateTo)
  })
  const completedBookings = filteredBookings.filter((booking) => booking.status === 'completed')
  const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0)

  return {
    title: 'Provider Earnings Report',
    subtitle: 'Revenue and payout snapshot based on completed provider bookings.',
    summaries: [
      { label: 'Completed Jobs', value: completedBookings.length, helper: 'Jobs contributing to revenue' },
      { label: 'Report Earnings', value: `$${totalEarnings.toFixed(2)}`, helper: 'Completed bookings in this report' },
      { label: 'Available Payout', value: `$${Number(payoutSummary?.available || 0).toFixed(2)}`, helper: 'Currently available to request' },
      { label: 'Requested Payouts', value: payoutRequests.length, helper: 'Requests recorded for this provider' },
    ],
    columns: [
      { key: 'service', label: 'Service' },
      { key: 'client', label: 'Client' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ],
    rows: completedBookings.map((booking) => ({
      service: booking.service_title || 'Service',
      client: booking.organizer_name || 'Guest',
      date: new Date(booking.booking_date || '').toLocaleDateString(),
      amount: `$${Number(booking.amount || 0).toFixed(2)}`,
      status: booking.status,
    })),
    insights: [
      `$${totalEarnings.toFixed(2)} has been earned from the filtered completed bookings.`,
      `$${Number(payoutSummary?.available || 0).toFixed(2)} remains available for payout requests.`,
      `${payoutRequests.length} payout requests are currently recorded on the dashboard.`,
    ],
  }
}

const buildClientActivityReport = (
  bookings: Booking[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedStatus = filters.status || 'all'
  const clientType = filters.clientType || 'all'
  const filteredBookings = bookings.filter((booking) => {
    const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus
    const clientMatches =
      clientType === 'all' ||
      (clientType === 'guest' && booking.is_guest_booking) ||
      (clientType === 'registered' && !booking.is_guest_booking)
    return statusMatches && clientMatches && matchesDateRange(booking.booking_date, dateFrom, dateTo)
  })
  const pendingBookings = filteredBookings.filter((booking) => booking.status === 'pending')
  const confirmedBookings = filteredBookings.filter((booking) => booking.status === 'confirmed')

  const clientRows = Array.from(
    filteredBookings.reduce((map, booking) => {
      const key = booking.organizer_name || 'Guest'
      const current = map.get(key) || { client: key, bookings: 0, completed: 0, type: booking.is_guest_booking ? 'Guest' : 'Registered' }
      current.bookings += 1
      if (booking.status === 'completed') current.completed += 1
      map.set(key, current)
      return map
    }, new Map<string, { client: string; bookings: number; completed: number; type: string }>()),
  )
    .map(([, item]) => item)
    .sort((a, b) => b.bookings - a.bookings)

  return {
    title: 'Provider Client Activity Report',
    subtitle: 'Organizer and guest booking activity for the provider account.',
    summaries: [
      { label: 'Unique Clients', value: clientRows.length, helper: 'Distinct booking clients' },
      { label: 'Repeat Clients', value: clientRows.filter((row) => row.bookings > 1).length, helper: 'Clients with multiple bookings' },
      { label: 'Pending Jobs', value: pendingBookings.length, helper: 'Requests still awaiting response' },
      { label: 'Confirmed Jobs', value: confirmedBookings.length, helper: 'Confirmed and upcoming work' },
    ],
    columns: [
      { key: 'client', label: 'Client' },
      { key: 'type', label: 'Type' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'completed', label: 'Completed' },
    ],
    rows: clientRows,
    insights: [
      `${clientRows[0]?.client || 'No client'} is the most active client in this slice.`,
      `${clientRows.filter((row) => row.bookings > 1).length} clients have booked more than once.`,
      `${pendingBookings.length} pending requests still need provider action.`,
    ],
  }
}

const buildServicePerformanceReport = (
  bookings: Booking[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedStatus = filters.status || 'all'
  const clientType = filters.clientType || 'all'
  const filteredBookings = bookings.filter((booking) => {
    const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus
    const clientMatches =
      clientType === 'all' ||
      (clientType === 'guest' && booking.is_guest_booking) ||
      (clientType === 'registered' && !booking.is_guest_booking)
    return statusMatches && clientMatches && matchesDateRange(booking.booking_date, dateFrom, dateTo)
  })
  const completedBookings = filteredBookings.filter((booking) => booking.status === 'completed')

  const serviceRows = Array.from(
    filteredBookings.reduce((map, booking) => {
      const key = booking.service_title || 'Untitled Service'
      const current = map.get(key) || { service: key, bookings: 0, completed: 0 }
      current.bookings += 1
      if (booking.status === 'completed') current.completed += 1
      map.set(key, current)
      return map
    }, new Map<string, { service: string; bookings: number; completed: number }>()),
  )
    .map(([, item]) => item)
    .sort((a, b) => b.bookings - a.bookings)

  return {
    title: 'Provider Service Performance Report',
    subtitle: 'Booking and completion mix across provider service offerings.',
    summaries: [
      { label: 'Services Booked', value: serviceRows.length, helper: 'Distinct services with bookings' },
      { label: 'Total Bookings', value: filteredBookings.length, helper: 'Bookings in the current filter set' },
      { label: 'Completed', value: completedBookings.length, helper: 'Delivered service jobs' },
      { label: 'Clients', value: new Set(filteredBookings.map((booking) => booking.organizer_name || 'Guest')).size, helper: 'Distinct organizers and guests' },
    ],
    columns: [
      { key: 'service', label: 'Service' },
      { key: 'bookings', label: 'Bookings' },
      { key: 'completed', label: 'Completed' },
    ],
    rows: serviceRows,
    insights: [
      `${serviceRows[0]?.service || 'No service'} is the most-booked service in this report.`,
      `${completedBookings.length} bookings have already been delivered.`,
      `${new Set(filteredBookings.map((booking) => booking.organizer_name || 'Guest')).size} clients are represented in the filtered data.`,
    ],
  }
}

const ProviderReports: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null)
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([])

  useEffect(() => {
    const initializeUser = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) setUser(JSON.parse(userStr))
    }

    initializeUser()
    void fetchReportData()
  }, [navigate])

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/signin')
        return
      }

      const [bookingsResponse, summaryResponse, requestsResponse] = await Promise.all([
        api.get('/provider-bookings', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/payouts/summary'),
        api.get('/payouts/my-requests'),
      ])

      setBookings(
        (bookingsResponse.data || []).map((booking: any) => ({
          id: booking.id,
          service_title: booking.service_title || booking.title,
          organizer_name: booking.organizer_name,
          booking_date: booking.booking_date,
          status: booking.status,
          is_guest_booking: Boolean(booking.is_guest_booking),
          amount: booking.amount ?? booking.price ?? 0,
        })),
      )
      setPayoutSummary(summaryResponse.data || null)
      setPayoutRequests(requestsResponse.data || [])
    } catch (error: any) {
      console.error('Error fetching report data:', error)
      if (error.response?.status === 401) {
        navigate('/signin')
      } else {
        setError('Failed to load report data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const buildProviderReport = useCallback(({
    reportType,
    dateFrom,
    dateTo,
    filters,
  }: {
    reportType: string
    dateFrom: string
    dateTo: string
    filters: Record<string, string>
  }): GeneratedReport => {
    switch (reportType) {
      case 'earnings':
        return buildEarningsReport(bookings, payoutSummary, payoutRequests, dateFrom, dateTo, filters)
      case 'client-activity':
        return buildClientActivityReport(bookings, dateFrom, dateTo, filters)
      case 'service-performance':
        return buildServicePerformanceReport(bookings, dateFrom, dateTo, filters)
      case 'booking-pipeline':
      default:
        return buildBookingPipelineReport(bookings, dateFrom, dateTo, filters)
    }
  }, [bookings, payoutSummary, payoutRequests])

  if (error) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <DashboardSidebar
          userRole="provider"
          userName={user?.name || 'Service Provider'}
          userEmail={user?.email || 'provider@huzz.com'}
          userImage={user?.profile_image}
          notifications={0}
          messages={0}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
          <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
            <DashboardHeader title="Provider Reports" subtitle="Generate booking, earnings, client, and service performance reports." />
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="provider"
        userName={user?.name || 'Service Provider'}
        userEmail={user?.email || 'provider@huzz.com'}
        userImage={user?.profile_image}
        notifications={0}
        messages={0}
        onLogout={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/signin')
        }}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
          <DashboardHeader title="Provider Reports" subtitle="Generate booking, earnings, client, and service performance reports." />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <DashboardReportSection
              description="Build booking, earnings, client, and service performance reports from your provider data."
              reportTypes={providerReportTypes}
              filters={providerReportFilters}
              defaultReportType="booking-pipeline"
              hideHeader
              buildReport={buildProviderReport}
            />
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default ProviderReports
