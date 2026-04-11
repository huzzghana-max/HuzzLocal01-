import React, { useEffect, useState } from 'react'
import { Box, CircularProgress, Container } from '@mui/material'
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

const AdminReports: React.FC = () => {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [pendingServicesCount, setPendingServicesCount] = useState(0)
  const [pendingPayoutRequestsCount, setPendingPayoutRequestsCount] = useState(0)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const parsed = JSON.parse(userStr)
      setAdminUser(parsed)
      if (parsed.role !== 'admin') {
        navigate('/signin')
        return
      }
    }
    void fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/signin')
        return
      }
      const [usersResponse, eventsResponse, servicesResponse, payoutsResponse] = await Promise.all([
        api.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/events', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/pending-services', { headers: { Authorization: `Bearer ${token}` } }),
        api.get('/admin/payout-requests', { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setUsers(usersResponse.data || [])
      setEvents(eventsResponse.data || [])
      setPendingServicesCount((servicesResponse.data || []).length)
      setPendingPayoutRequestsCount((payoutsResponse.data || []).filter((item: any) => item.status === 'pending').length)
    } catch (error: any) {
      if (error.response?.status === 401) navigate('/signin')
    } finally {
      setLoading(false)
    }
  }

  const matchesDateRange = (value: string | undefined, dateFrom: string, dateTo: string) => {
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

  const buildAdminReport = ({
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
    const selectedRole = filters.role || 'all'
    const selectedEventStatus = filters.eventStatus || 'all'
    const filteredUsers = users.filter((user) => {
      const roleMatches = selectedRole === 'all' || user.role === selectedRole
      return roleMatches && matchesDateRange(user.created_at, dateFrom, dateTo)
    })
    const filteredEvents = events.filter((event) => {
      const statusMatches = selectedEventStatus === 'all' || event.status === selectedEventStatus
      return statusMatches && matchesDateRange(event.date, dateFrom, dateTo)
    })
    const organizersCount = users.filter((user) => user.role === 'organizer').length
    const providersCount = users.filter((user) => user.role === 'provider').length
    const adminsCount = users.filter((user) => user.role === 'admin').length
    const activeEventsCount = events.filter((event) => ['published', 'confirmed', 'ongoing'].includes(event.status)).length

    if (reportType === 'user-directory') {
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
        ],
      }
    }

    if (reportType === 'event-operations') {
      return {
        title: 'Admin Event Operations Report',
        subtitle: 'Operational event inventory across status and organizer ownership.',
        summaries: [
          { label: 'Events', value: filteredEvents.length, helper: 'Events in the current report slice' },
          { label: 'Active', value: filteredEvents.filter((event) => ['published', 'confirmed', 'ongoing'].includes(event.status)).length, helper: 'Published, confirmed, or ongoing events' },
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
        ],
      }
    }

    if (reportType === 'approvals-payouts') {
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
      ],
      insights: [
        `${providersCount} providers are currently registered on the platform.`,
        `${activeEventsCount} events are considered active right now.`,
        `${pendingServicesCount + pendingPayoutRequestsCount} total admin backlog items are visible across approvals and payouts.`,
      ],
    }
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <DashboardReportSection
              title="Admin Report Builder"
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
