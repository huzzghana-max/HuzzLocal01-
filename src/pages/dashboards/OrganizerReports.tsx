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
  role: string
  profile_image?: string
}

interface EventItem {
  id: number
  name: string
  date: string
  status: string
  vendors: number
}

interface ServiceBooking {
  id: number
  service_title: string
  vendor_name: string
  booking_date: string
  notes: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
}

const organizerReportTypes: ReportOption[] = [
  { value: 'event-summary', label: 'Event Summary', description: 'Overview of event schedule, status, and vendor coverage.' },
  { value: 'booking-activity', label: 'Booking Activity', description: 'Track pending, confirmed, completed, and cancelled service bookings.' },
  { value: 'vendor-usage', label: 'Vendor Usage', description: 'See which vendors are used most often across your events and bookings.' },
  { value: 'delivery-overview', label: 'Delivery Overview', description: 'Highlight completed work, upcoming event load, and overall organizer activity.' },
]

const organizerReportFilters: ReportFilter[] = [
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
]

const OrganizerReports: React.FC = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [bookings, setBookings] = useState<ServiceBooking[]>([])

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) setUser(JSON.parse(userStr))
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
      const [statsResponse, bookingsResponse] = await Promise.all([
        api.get('/dashboard/organizer-stats'),
        api.get('/my-bookings'),
      ])
      setStats(statsResponse.data)
      setEvents(statsResponse.data?.events || [])
      setBookings(bookingsResponse.data || [])
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

  const buildOrganizerReport = ({
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
    const selectedStatus = filters.status || 'all'
    const filteredEvents = events.filter((event) => {
      const statusMatches = selectedStatus === 'all' || event.status === selectedStatus
      return statusMatches && matchesDateRange(event.date, dateFrom, dateTo)
    })
    const filteredBookings = bookings.filter((booking) => {
      const statusMatches = selectedStatus === 'all' || booking.status === selectedStatus
      return statusMatches && matchesDateRange(booking.booking_date, dateFrom, dateTo)
    })
    const uniqueVendors = new Set(filteredBookings.map((booking) => booking.vendor_name).filter(Boolean))
    const completedBookings = filteredBookings.filter((booking) => booking.status === 'completed')
    const pendingBookings = filteredBookings.filter((booking) => booking.status === 'pending')
    const upcomingEvents = filteredEvents.filter((event) => new Date(event.date) > new Date())

    if (reportType === 'booking-activity') {
      return {
        title: 'Organizer Booking Activity Report',
        subtitle: 'Current service-booking pipeline for the selected organizer filters.',
        summaries: [
          { label: 'Total Bookings', value: filteredBookings.length, helper: 'Bookings in the chosen range' },
          { label: 'Pending', value: pendingBookings.length, helper: 'Awaiting action or confirmation' },
          { label: 'Completed', value: completedBookings.length, helper: 'Services already delivered' },
          { label: 'Active Vendors', value: uniqueVendors.size, helper: 'Distinct vendors in the booking set' },
        ],
        columns: [
          { key: 'service', label: 'Service' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'date', label: 'Booking Date' },
          { key: 'status', label: 'Status' },
          { key: 'notes', label: 'Notes' },
        ],
        rows: filteredBookings.map((booking) => ({
          service: booking.service_title,
          vendor: booking.vendor_name,
          date: new Date(booking.booking_date).toLocaleDateString(),
          status: booking.status,
          notes: booking.notes || 'No notes',
        })),
        insights: [
          `${pendingBookings.length} bookings still need attention from your organizer workflow.`,
          `${completedBookings.length} bookings have already been delivered in this range.`,
          `${uniqueVendors.size} distinct vendors are represented in the filtered results.`,
        ],
      }
    }

    if (reportType === 'vendor-usage') {
      const vendorUsage = Array.from(
        filteredBookings.reduce((map, booking) => {
          const current = map.get(booking.vendor_name) || { vendor: booking.vendor_name, bookings: 0, completed: 0 }
          current.bookings += 1
          if (booking.status === 'completed') current.completed += 1
          map.set(booking.vendor_name, current)
          return map
        }, new Map<string, { vendor: string; bookings: number; completed: number }>()),
      )
        .map(([, item]) => item)
        .sort((a, b) => b.bookings - a.bookings)

      return {
        title: 'Organizer Vendor Usage Report',
        subtitle: 'Which vendors are being used most and how much work has been completed with them.',
        summaries: [
          { label: 'Unique Vendors', value: vendorUsage.length, helper: 'Vendors in selected bookings' },
          { label: 'Repeat Vendors', value: vendorUsage.filter((item) => item.bookings > 1).length, helper: 'Vendors with multiple bookings' },
          { label: 'Completed Jobs', value: completedBookings.length, helper: 'Finished bookings in the range' },
          { label: 'Upcoming Events', value: upcomingEvents.length, helper: 'Events still ahead on the calendar' },
        ],
        columns: [
          { key: 'vendor', label: 'Vendor' },
          { key: 'bookings', label: 'Bookings' },
          { key: 'completed', label: 'Completed' },
        ],
        rows: vendorUsage,
        insights: [
          `${vendorUsage[0]?.vendor || 'No vendor'} is currently the most-used vendor in this report.`,
          `${vendorUsage.filter((item) => item.bookings > 1).length} vendors are repeat partners.`,
          `${upcomingEvents.length} upcoming events may still require additional coordination.`,
        ],
      }
    }

    if (reportType === 'delivery-overview') {
      return {
        title: 'Organizer Delivery Overview',
        subtitle: 'High-level snapshot of completed work, bookings, and event readiness.',
        summaries: [
          { label: 'Total Events', value: filteredEvents.length, helper: 'Events matching the current date/status filters' },
          { label: 'Upcoming Events', value: upcomingEvents.length, helper: 'Future events still on your calendar' },
          { label: 'Total Vendors', value: uniqueVendors.size, helper: 'Vendors working with this organizer' },
          { label: 'Revenue', value: `$${Number(stats?.totalRevenue || 0).toFixed(2)}`, helper: 'Completed-booking revenue from dashboard stats' },
        ],
        columns: [
          { key: 'event', label: 'Event' },
          { key: 'date', label: 'Date' },
          { key: 'status', label: 'Status' },
          { key: 'vendors', label: 'Vendors' },
        ],
        rows: filteredEvents.map((event) => ({
          event: event.name,
          date: new Date(event.date).toLocaleDateString(),
          status: event.status,
          vendors: event.vendors,
        })),
        insights: [
          `${upcomingEvents.length} events remain upcoming in the selected range.`,
          `${uniqueVendors.size} vendors are contributing across your filtered bookings.`,
          `$${Number(stats?.totalRevenue || 0).toFixed(2)} is the current revenue total shown on the dashboard.`,
        ],
      }
    }

    return {
      title: 'Organizer Event Summary Report',
      subtitle: 'Event-level overview for planning and monitoring organizer activity.',
      summaries: [
        { label: 'Total Events', value: filteredEvents.length, helper: 'Events in the selected range' },
        { label: 'Upcoming', value: upcomingEvents.length, helper: 'Scheduled for the future' },
        { label: 'Booked Vendors', value: uniqueVendors.size, helper: 'Distinct vendors connected to current bookings' },
        { label: 'Bookings', value: filteredBookings.length, helper: 'Service bookings related to this dashboard' },
      ],
      columns: [
        { key: 'event', label: 'Event' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'vendors', label: 'Vendors' },
      ],
      rows: filteredEvents.map((event) => ({
        event: event.name,
        date: new Date(event.date).toLocaleDateString(),
        status: event.status,
        vendors: event.vendors,
      })),
      insights: [
        `${filteredEvents.length} events are included in this reporting slice.`,
        `${upcomingEvents.length} events are still upcoming and may need preparation work.`,
        `${filteredBookings.length} related bookings support these events right now.`,
      ],
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <DashboardSidebar
        userRole="organizer"
        userName={user?.name || 'Organizer'}
        userEmail={user?.email || 'organizer@huzz.com'}
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
          <DashboardHeader title="Organizer Reports" subtitle="Generate event, booking, and vendor reports from your organizer data." />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <DashboardReportSection
              title="Organizer Report Builder"
              description="Build event, booking, and vendor reports directly from your organizer data."
              reportTypes={organizerReportTypes}
              filters={organizerReportFilters}
              defaultReportType="event-summary"
              hideHeader
              buildReport={buildOrganizerReport}
            />
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default OrganizerReports
