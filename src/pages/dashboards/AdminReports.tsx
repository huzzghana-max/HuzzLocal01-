import React, { useEffect, useState, useCallback } from 'react'
import { Alert, Box, CircularProgress, Container, Stack, Typography } from '@mui/material'
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
  role: 'organizer' | 'provider' | 'admin'
  profile_image?: string
  created_at?: string
}

interface EventItem {
  id: number
  name: string
  date: string
  location: string
  organizer_id: number
  organizer_name: string
  status: string
}

const adminReportTypes: ReportOption[] = [
  { value: 'platform-overview', label: 'Platform Overview', description: 'High-level user, event, and operational totals for the platform.' },
  { value: 'user-directory', label: 'User Directory', description: 'Break down users by role and export the currently loaded account directory.' },
  { value: 'event-operations', label: 'Event Operations', description: 'Track event statuses, organizer ownership, and operational event load.' },
  { value: 'approvals-payouts', label: 'Approvals & Payouts', description: 'Surface current approval and payout backlog from admin indicators.' },
]

const adminReportFilters: ReportFilter[] = [
  {
    key: 'role',
    label: 'Role',
    appliesTo: ['user-directory'],
    options: [
      { label: 'All Roles', value: 'all' },
      { label: 'Organizer', value: 'organizer' },
      { label: 'Provider', value: 'provider' },
      { label: 'Admin', value: 'admin' },
    ],
  },
  {
    key: 'eventStatus',
    label: 'Event Status',
    appliesTo: ['event-operations'],
    options: [
      { label: 'All Statuses', value: 'all' },
      { label: 'Published', value: 'published' },
      { label: 'Confirmed', value: 'confirmed' },
      { label: 'Ongoing', value: 'ongoing' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Draft', value: 'draft' },
      { label: 'Pending', value: 'pending' },
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
const buildPlatformOverviewReport = (
  users: User[],
  events: EventItem[],
  pendingServicesCount: number,
  pendingPayoutRequestsCount: number
): GeneratedReport => {
  const organizersCount = users.filter((user) => user.role === 'organizer').length
  const providersCount = users.filter((user) => user.role === 'provider').length
  const adminsCount = users.filter((user) => user.role === 'admin').length
  const activeEventsCount = events.filter((event) => ['published', 'confirmed', 'ongoing'].includes(event.status)).length
  const upcomingEventsCount = events.filter((event) => new Date(event.date) > new Date()).length
  const cancelledEventsCount = events.filter((event) => event.status === 'cancelled').length

  return {
    title: 'Admin Platform Overview Report',
    subtitle: 'Combined user, event, and backlog overview for platform operations.',
    summaries: [
      { label: 'Total Users', value: users.length, helper: 'All loaded users' },
      { label: 'Total Events', value: events.length, helper: 'All loaded events' },
      { label: 'Pending Services', value: pendingServicesCount, helper: 'Backlog awaiting service approval' },
      { label: 'Pending Payouts', value: pendingPayoutRequestsCount, helper: 'Backlog awaiting payout approval' },
    ],
    columns: [
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'detail', label: 'Detail' },
    ],
    rows: [
      { metric: 'Organizers', value: organizersCount, detail: 'Organizer accounts on the platform' },
      { metric: 'Providers', value: providersCount, detail: 'Service provider accounts on the platform' },
      { metric: 'Admins', value: adminsCount, detail: 'Administrative accounts' },
      { metric: 'Active Events', value: activeEventsCount, detail: 'Published, confirmed, or ongoing events' },
      { metric: 'Upcoming Events', value: upcomingEventsCount, detail: 'Future events already on the calendar' },
      { metric: 'Cancelled Events', value: cancelledEventsCount, detail: 'Events currently marked as cancelled' },
    ],
    insights: [
      `${providersCount} providers are currently registered on the platform.`,
      `${activeEventsCount} events are considered active right now.`,
      `${upcomingEventsCount} events are still upcoming and may require ongoing admin visibility.`,
      `${pendingServicesCount + pendingPayoutRequestsCount} total admin backlog items are visible across approvals and payouts.`,
    ],
  }
}

const buildUserDirectoryReport = (
  users: User[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedRole = filters.role || 'all'
  const filteredUsers = users.filter((user) => {
    const roleMatches = selectedRole === 'all' || user.role === selectedRole
    return roleMatches && matchesDateRange(user.created_at, dateFrom, dateTo)
  })
  const newestUser = filteredUsers
    .filter((user) => user.created_at)
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]

  return {
    title: 'Admin User Directory Report',
    subtitle: 'Role-based export of users currently available in the admin dashboard.',
    summaries: [
      { label: 'Users', value: filteredUsers.length, helper: 'Users in the selected role/date slice' },
      { label: 'Organizers', value: filteredUsers.filter((user) => user.role === 'organizer').length, helper: 'Organizer accounts in this report' },
      { label: 'Providers', value: filteredUsers.filter((user) => user.role === 'provider').length, helper: 'Provider accounts in this report' },
      { label: 'Admins', value: filteredUsers.filter((user) => user.role === 'admin').length, helper: 'Administrative accounts in this report' },
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'created', label: 'Created' },
    ],
    rows: filteredUsers.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      created: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown',
    })),
    insights: [
      `${filteredUsers.filter((user) => user.role === 'provider').length} provider accounts are visible in this filtered directory.`,
      `${filteredUsers.filter((user) => user.role === 'organizer').length} organizer accounts are included.`,
      `${filteredUsers.length} total users match the current report filters.`,
      newestUser ? `${newestUser.name} is the newest account in the current report slice.` : 'No dated user records are available in the current report slice.',
    ],
  }
}

const buildEventOperationsReport = (
  events: EventItem[],
  dateFrom: string,
  dateTo: string,
  filters: Record<string, string>
): GeneratedReport => {
  const selectedEventStatus = filters.eventStatus || 'all'
  const filteredEvents = events.filter((event) => {
    const statusMatches = selectedEventStatus === 'all' || event.status === selectedEventStatus
    return statusMatches && matchesDateRange(event.date, dateFrom, dateTo)
  })
  const upcomingEvents = filteredEvents.filter((event) => new Date(event.date) > new Date())

  return {
    title: 'Admin Event Operations Report',
    subtitle: 'Operational event inventory across status and organizer ownership.',
    summaries: [
      { label: 'Events', value: filteredEvents.length, helper: 'Events in the current report slice' },
      { label: 'Active', value: filteredEvents.filter((event) => ['published', 'confirmed', 'ongoing'].includes(event.status)).length, helper: 'Published, confirmed, or ongoing events' },
      { label: 'Upcoming', value: upcomingEvents.length, helper: 'Future events in the filtered slice' },
      { label: 'Completed', value: filteredEvents.filter((event) => event.status === 'completed').length, helper: 'Finished events' },
      { label: 'Cancelled', value: filteredEvents.filter((event) => event.status === 'cancelled').length, helper: 'Cancelled events' },
    ],
    columns: [
      { key: 'event', label: 'Event' },
      { key: 'organizer', label: 'Organizer' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'location', label: 'Location' },
    ],
    rows: filteredEvents.map((event) => ({
      event: event.name,
      organizer: event.organizer_name,
      date: new Date(event.date).toLocaleDateString(),
      status: event.status,
      location: event.location || 'Not set',
    })),
    insights: [
      `${filteredEvents.filter((event) => ['published', 'confirmed', 'ongoing'].includes(event.status)).length} events are actively in flight.`,
      `${filteredEvents.filter((event) => event.status === 'cancelled').length} events are marked cancelled.`,
      `${new Set(filteredEvents.map((event) => event.organizer_id)).size} organizers are represented in this export.`,
      `${upcomingEvents.length} of these events still sit ahead on the calendar.`,
    ],
  }
}

const buildApprovalsPayoutsReport = (
  users: User[],
  events: EventItem[],
  pendingServicesCount: number,
  pendingPayoutRequestsCount: number
): GeneratedReport => {
  return {
    title: 'Admin Approvals and Payouts Report',
    subtitle: 'Operational queue summary for service approvals and payout requests.',
    summaries: [
      { label: 'Pending Services', value: pendingServicesCount, helper: 'Service submissions awaiting review' },
      { label: 'Pending Payouts', value: pendingPayoutRequestsCount, helper: 'Payout requests awaiting approval' },
      { label: 'Users', value: users.length, helper: 'Current loaded user inventory' },
      { label: 'Events', value: events.length, helper: 'Current loaded event inventory' },
    ],
    columns: [
      { key: 'queue', label: 'Queue' },
      { key: 'count', label: 'Count' },
      { key: 'status', label: 'Status' },
      { key: 'action', label: 'Suggested Action' },
    ],
    rows: [
      { queue: 'Service Approvals', count: pendingServicesCount, status: pendingServicesCount > 0 ? 'Needs review' : 'Clear', action: 'Review pending services' },
      { queue: 'Payout Requests', count: pendingPayoutRequestsCount, status: pendingPayoutRequestsCount > 0 ? 'Needs review' : 'Clear', action: 'Review payout requests' },
    ],
    insights: [
      `${pendingServicesCount} services are currently waiting for admin approval.`,
      `${pendingPayoutRequestsCount} payout requests are currently waiting for action.`,
      `This report uses the latest dashboard counters already loaded in the admin view.`,
    ],
  }
}

const AdminReports: React.FC = () => {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [pendingServicesCount, setPendingServicesCount] = useState(0)
  const [pendingPayoutRequestsCount, setPendingPayoutRequestsCount] = useState(0)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    const initializeUser = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const parsed = JSON.parse(userStr)
        setAdminUser(parsed)
        if (parsed.role !== 'admin') {
          navigate('/signin')
          return false
        }
      }
      return true
    }

    if (!initializeUser()) return
    void fetchReportData()
  }, [navigate])

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setWarnings([])
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/signin')
        return
      }

      const [usersResponse, eventsResponse, servicesResponse, payoutsResponse] = await Promise.allSettled([
        api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/events', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/pending-services', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/payout-requests', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const nextWarnings: string[] = []

      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value.data || [])
      } else {
        console.error('Error fetching admin users for reports:', usersResponse.reason)
        setUsers([])
        nextWarnings.push('User directory data could not be loaded, so user-based report totals may be incomplete.')
      }

      if (eventsResponse.status === 'fulfilled') {
        setEvents(eventsResponse.value.data || [])
      } else {
        console.error('Error fetching admin events for reports:', eventsResponse.reason)
        setEvents([])
        nextWarnings.push('Event data could not be loaded, so event reports may be incomplete.')
      }

      if (servicesResponse.status === 'fulfilled') {
        setPendingServicesCount((servicesResponse.value.data || []).length)
      } else {
        console.error('Error fetching pending services for reports:', servicesResponse.reason)
        setPendingServicesCount(0)
        nextWarnings.push('Pending services could not be loaded, so service-approval backlog counts are showing as 0 for now.')
      }

      if (payoutsResponse.status === 'fulfilled') {
        setPendingPayoutRequestsCount((payoutsResponse.value.data || []).filter((item: any) => item.status === 'pending').length)
      } else {
        console.error('Error fetching payout requests for reports:', payoutsResponse.reason)
        setPendingPayoutRequestsCount(0)
        nextWarnings.push('Payout request data could not be loaded, so payout backlog counts are showing as 0 for now.')
      }

      if (nextWarnings.length === 4) {
        setError('Failed to load any report data. Please try again.')
        return
      }

      setWarnings(nextWarnings)
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

  const buildAdminReport = useCallback(({
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
      case 'user-directory':
        return buildUserDirectoryReport(users, dateFrom, dateTo, filters)
      case 'event-operations':
        return buildEventOperationsReport(events, dateFrom, dateTo, filters)
      case 'approvals-payouts':
        return buildApprovalsPayoutsReport(users, events, pendingServicesCount, pendingPayoutRequestsCount)
      case 'platform-overview':
      default:
        return buildPlatformOverviewReport(users, events, pendingServicesCount, pendingPayoutRequestsCount)
    }
  }, [users, events, pendingServicesCount, pendingPayoutRequestsCount])

  if (error) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
        <DashboardSidebar
          userRole="admin"
          userName={adminUser?.name || 'Admin User'}
          userEmail={adminUser?.email || 'admin@huzz.com'}
          userImage={adminUser?.profile_image}
          notifications={0}
          messages={pendingServicesCount}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
          <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
            <DashboardHeader title="Admin Reports" subtitle="Generate platform, user, event, and queue reports from admin data." />
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
        userRole="admin"
        userName={adminUser?.name || 'Admin User'}
        userEmail={adminUser?.email || 'admin@huzz.com'}
        userImage={adminUser?.profile_image}
        notifications={0}
        messages={pendingServicesCount}
        onLogout={() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/signin')
        }}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
          <DashboardHeader title="Admin Reports" subtitle="Generate platform, user, event, and queue reports from admin data." />
          {warnings.length > 0 && (
            <Stack spacing={1.25} sx={{ mb: 2 }}>
              {warnings.map((warning, index) => (
                <Alert key={`${warning}-${index}`} severity="warning" sx={{ borderRadius: 2 }}>
                  {warning}
                </Alert>
              ))}
            </Stack>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <DashboardReportSection
              description="Build platform, user, event, and admin-queue reports from the latest loaded admin data."
              reportTypes={adminReportTypes}
              filters={adminReportFilters}
              defaultReportType="platform-overview"
              hideHeader
              buildReport={buildAdminReport}
            />
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AdminReports
