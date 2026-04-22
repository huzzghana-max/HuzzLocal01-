import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Button,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Rating,
  Alert,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import EventIcon from '@mui/icons-material/Event'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PendingIcon from '@mui/icons-material/Pending'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PeopleIcon from '@mui/icons-material/People'
import ShareIcon from '@mui/icons-material/Share'
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

interface Event {
  id: number
  name: string
  date: string
  status: 'confirmed' | 'pending' | 'cancelled'
  vendors: number
  type?: string
  location?: string
  latitude?: number
  longitude?: number
  description?: string
  image_url?: string
}

interface ServiceBooking {
  id: number
  service_id: number
  vendor_id: number
  organizer_id: number
  service_title: string
  vendor_name: string
  booking_date: string
  notes: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  created_at: string
}

interface Conversation {
  user_id: number
  name: string
  email: string
  profile_image?: string
  last_message?: string
  last_message_time?: string
  unread_count: number
}

const OrganizerDashboard: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [bookings, setBookings] = useState<ServiceBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewBooking, setReviewBooking] = useState<ServiceBooking | null>(null)
  const [reviewRating, setReviewRating] = useState<number | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([])
  const [shareInfo, setShareInfo] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const conversationPollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  //Trying to setup the massage badge dispay to sync with the current unread measages 
  // in the messaging page

  const fetchConversations = async () => {
      try {
        const response = await api.get('/conversations')
        
        // Deduplicate conversations by user_id and sort by most recent
        const conversationMap = new Map(response.data.map((conv: Conversation) => [conv.user_id, conv]))
        const uniqueConversations: Conversation[] = Array.from(conversationMap.values()) as Conversation[]
        
        uniqueConversations.sort((a: Conversation, b: Conversation) => {
          const timeA = new Date(a.last_message_time || 0).getTime()
          const timeB = new Date(b.last_message_time || 0).getTime()
          return timeB - timeA // Most recent first
        })
        
        // Only update if:
        // 1. Number of conversations changed
        // 2. Last message content changed
        // 3. Order changed
        setConversations((prevConvs: Conversation[]) => {
          if (prevConvs.length !== uniqueConversations.length) {
            return uniqueConversations
          }
          
          // Check if any conversation's last message or time changed
          const hasChanges = prevConvs.some((prevConv: Conversation, index: number) => {
            const newConv: Conversation = uniqueConversations[index]
            return (
              prevConv.user_id !== newConv.user_id ||
              prevConv.last_message !== newConv.last_message ||
              prevConv.last_message_time !== newConv.last_message_time ||
              prevConv.unread_count !== newConv.unread_count
            )
          })
          
          return hasChanges ? uniqueConversations : prevConvs
        })
        
        // Separately handle loading state to avoid flickering
        if (loading) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
        if (loading) {
          setLoading(false)
        }
      }
    }





    // Fetch reviewed bookings for this user
    useEffect(() => {
      const fetchReviewed = async () => {
        try {
          if (!user?.id) return
          const response = await api.get('/reviews/by-reviewer')
          // Only store booking ids that have been reviewed by this user
          setReviewedBookings(response.data.map((r: any) => r.booking_id))
        } catch (err) {
          console.error('Failed to fetch reviews:', err)
        }
      }
      if (user?.id) fetchReviewed()
    }, [user?.id])
    const handleOpenReviewDialog = (booking: ServiceBooking) => {
      setReviewBooking(booking)
      setReviewRating(null)
      setReviewComment('')
      setReviewDialogOpen(true)
      setReviewError('')
      setReviewSuccess('')
    }

    const handleSubmitReview = async () => {
      if (!reviewBooking || !reviewRating) {
        setReviewError('Please provide a rating.')
        return
      }
      setReviewSubmitting(true)
      setReviewError('')
      try {
        await api.post('/reviews', {
          booking_id: reviewBooking.id,
          provider_id: reviewBooking.vendor_id,
          rating: reviewRating,
          comment: reviewComment,
        })
        setReviewSuccess('Review submitted!')
        setReviewedBookings((prev) => [...prev, reviewBooking.id])
        setTimeout(() => setReviewDialogOpen(false), 1200)
      } catch (err: any) {
        setReviewError(err.response?.data?.message || 'Failed to submit review.')
      } finally {
        setReviewSubmitting(false)
      }
    }
  const [newEvent, setNewEvent] = useState({ name: '', date: '', type: '', location: '', latitude: '', longitude: '', description: '' })
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const locationInputRef = React.useRef<HTMLInputElement | null>(null)
  const [ticketsDialogOpen, setTicketsDialogOpen] = useState(false)
  const [currentEventTickets, setCurrentEventTickets] = useState<any[]>([])
  const [currentEventId, setCurrentEventId] = useState<number | null>(null)
  const [ticketLoading, setTicketLoading] = useState(false)
  const [newTicket, setNewTicket] = useState({ ticket_type: '', price: '', quantity: '' })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    fetchDashboardData()
    fetchConversations()
   
   
   // Poll conversations every 5 seconds
    conversationPollingRef.current = setInterval(() => {
      fetchConversations()
    }, 5000)
    
    // Auto-refresh bookings every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000)

    return () =>{ clearInterval(interval)
        if (conversationPollingRef.current) {
        clearInterval(conversationPollingRef.current)
      }
    }





  }, [])

  useEffect(() => {
    if (!openDialog) return

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const attach = () => {
      try {
        const google = (window as any).google
        if (!google?.maps?.places || !locationInputRef.current) return
        const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current, { types: ['geocode'] })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const formatted = place.formatted_address || place.name || locationInputRef.current!.value
          const lat = place.geometry?.location?.lat && place.geometry.location.lat()
          const lng = place.geometry?.location?.lng && place.geometry.location.lng()
          setNewEvent((prev) => ({
            ...prev,
            location: formatted,
            latitude: lat ? String(lat) : '',
            longitude: lng ? String(lng) : '',
          }))
        })
      } catch (err) {
        console.warn('Event location autocomplete attach failed', err)
      }
    }

    if ((window as any).google?.maps?.places) {
      attach()
      return
    }

    const existingScript = document.querySelector('script[data-google-maps="true"]') as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener('load', attach, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.dataset.googleMaps = 'true'
    script.onload = attach
    document.head.appendChild(script)
  }, [openDialog])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        navigate('/signin')
        return
      }
      const response = await api.get('/dashboard/organizer-stats')
      setStats(response.data)
      setEvents(response.data.events || [])

      // Fetch service bookings
      try {
        const bookingsResponse = await api.get('/my-bookings')
        setBookings(bookingsResponse.data || [])
      } catch (bookingError) {
        console.error('Failed to fetch bookings:', bookingError)
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      if (error.response?.status === 401) {
        navigate('/signin')
      }
    } finally {
      //setLoading(false)

      
    }

    try{
    if (loading) {
        setLoading(false)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      if (loading) {
        setLoading(false)
      }
    }

  }

  const handleCreateEvent = () => {
    setOpenDialog(true)
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }
    
    try {
      await api.delete(`/events/${eventId}`)
      setEvents(events.filter((e) => e.id !== eventId))
      alert('Event deleted successfully!')
    } catch (error) {
      console.error('Failed to delete event:', error)
      alert('Failed to delete event. Please try again.')
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEventId(event.id)
    setNewEvent({
      name: event.name,
      date: event.date,
      type: event.type || '',
      location: event.location || '',
      latitude: event.latitude ? String(event.latitude) : '',
      longitude: event.longitude ? String(event.longitude) : '',
      description: event.description || '',
    })
    setOpenDialog(true)
  }

  const openTicketsDialog = async (eventId: number) => {
    setCurrentEventId(eventId)
    setTicketsDialogOpen(true)
    setTicketLoading(true)
    try {
      const resp = await api.get(`/events/${eventId}/tickets`)
      setCurrentEventTickets(resp.data || [])
    } catch (err) {
      console.error('Failed to load tickets:', err)
      alert('Failed to load tickets')
    } finally {
      setTicketLoading(false)
    }
  }

  const closeTicketsDialog = () => {
    setTicketsDialogOpen(false)
    setCurrentEventTickets([])
    setNewTicket({ ticket_type: '', price: '', quantity: '' })
  }

  const handleCreateTicket = async (eventId?: number | null) => {
    if (!newTicket.ticket_type || !newTicket.price || !newTicket.quantity) {
      alert('Please fill all ticket fields')
      return
    }
    try {
      const targetEventId = eventId || currentEventId
      if (!targetEventId) {
        alert('Event not selected')
        return
      }
      const payload = { ticket_type: newTicket.ticket_type, price: parseFloat(newTicket.price), quantity: parseInt(newTicket.quantity) }
      const resp = await api.post(`/events/${targetEventId}/tickets`, payload)
      setCurrentEventTickets(prev => [...prev, resp.data])
      setNewTicket({ ticket_type: '', price: '', quantity: '' })
    } catch (err) {
      console.error('Create ticket failed:', err)
      alert((err as any).response?.data?.message || 'Failed to create ticket')
    }
  }



  // Cancel booking handler
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to cancel bookings');
        return;
      }
      await api.put(
        `/service-bookings/${bookingId}`,
        { status: 'cancelled' }
      );
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      alert('Failed to cancel booking.');
      console.error('Cancel booking error:', error);
    }
  }

  // Fix: Add missing handleCloseDialog function
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEventId(null);
    setNewEvent({ name: '', date: '', type: '', location: '', latitude: '', longitude: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageError(null)
    
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file')
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setImageError('Image size must be less than 5MB')
      setImageFile(null)
      setImagePreview(null)
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    setImageFile(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setImageError(null)
  }

  const handleSaveEvent = async () => {
    if (!newEvent.name || !newEvent.date) {
      alert('Please fill all required fields')
      return
    }
    try {
      const form = new FormData()
      form.append('name', newEvent.name)
      form.append('date', newEvent.date)
      form.append('type', newEvent.type || '')
      form.append('location', newEvent.location || '')
      form.append('latitude', newEvent.latitude || '')
      form.append('longitude', newEvent.longitude || '')
      form.append('description', newEvent.description || '')
      if (imageFile) form.append('image', imageFile)

      if (editingEventId) {
        // Edit existing event
        await api.put(`/events/${editingEventId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Event updated successfully!')
      } else {
        // Create new event
        await api.post('/events', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        alert('Event created successfully!')
      }
      
      handleCloseDialog()
      // Refresh dashboard data to show the updated/newly created event
      await fetchDashboardData()
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event. Please try again.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const handleShareEvent = async (eventId: number) => {
    const publicUrl = `${window.location.origin}/events/public/${eventId}`
    try {
      await navigator.clipboard.writeText(publicUrl)
      setShareInfo('Public event link copied to clipboard.')
      setTimeout(() => setShareInfo(''), 3000)
    } catch {
      setShareInfo(`Share this link: ${publicUrl}`)
      setTimeout(() => setShareInfo(''), 6000)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <DashboardSidebar
        userRole="organizer"
        userName={user?.name || 'Organizer'}
        userEmail={user?.email || 'organizer@huzz.com'}
        userImage={user?.profile_image}
        notifications={stats?.pendingBookings || 0}
        messages={conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3 }, flex: 1 }}>
          {/* Header */}
          <DashboardHeader
            title="Organizer Dashboard"
            subtitle="Manage your events, bookings, and service providers"
            actionButton={
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, width: '100%' }}>
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  onClick={handleCreateEvent}
                  sx={{
                    backgroundColor: '#414958',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '12px',
                    py: 1,
                    px: 3,
                    boxShadow: '0 4px 15px rgba(65, 73, 88, 0.3)',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: '#2B3240',
                      boxShadow: '0 8px 25px rgba(65, 73, 88, 0.38)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  New Event
                </Button>
                <Button
                  startIcon={<ReceiptIcon />}
                  variant="outlined"
                  onClick={() => navigate('/organizer/registrants-tickets')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#414958',
                    color: '#414958',
                    borderRadius: '12px',
                    border: '2px solid',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#2B3240',
                      backgroundColor: 'rgba(65, 73, 88, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Registrants & Tickets
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/browse-vendors')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: '#414958',
                    color: '#414958',
                    borderRadius: '12px',
                    border: '2px solid',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#2B3240',
                      backgroundColor: 'rgba(65, 73, 88, 0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Browse Vendors
                </Button>
              </Box>
            }
          />
          {shareInfo && (
            <Alert severity="info" sx={{ mb: 2 }} onClose={() => setShareInfo('')}>
              {shareInfo}
            </Alert>
          )}

          {/* Loading State */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <>
              {/* Stats Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 5 }}>
                <StatCard title="Total Events" value={stats?.totalEvents || 0} icon={<EventIcon />} color="primary" />
                <StatCard title="Pending Bookings" value={stats?.pendingBookings || 0} icon={<PendingIcon />} color="warning" />
                <StatCard title="Upcoming Events" value={stats?.upcomingEvents || 0} icon={<CalendarMonthIcon />} color="info" />
                <StatCard title="Total Vendors" value={stats?.totalVendors || 0} icon={<PeopleIcon />} color="secondary" />
              </Box>

              {/* Events Section */}
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Your Events
              </Typography>

              {/* Events Table */}
              {events.length === 0 ? (
                <Paper
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    borderRadius: 2,
                  }}
                >
                  <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No events yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    Create your first event to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleCreateEvent}
                  >
                    Create Event
                  </Button>
                </Paper>
              ) : isMobile ? (
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {events.map((event) => (
                    <Paper
                      key={event.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{event.name}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {new Date(event.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={event.status}
                          size="small"
                          color={event.status === 'confirmed' ? 'success' : event.status === 'pending' ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </Box>
                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={`${event.vendors} vendors`} variant="outlined" size="small" />
                        {event.type && <Chip label={event.type} variant="outlined" size="small" />}
                      </Box>
                      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          variant="contained"
                          onClick={() => handleEditEvent(event)}
                          fullWidth
                        >
                          Edit Event
                        </Button>
                        <Button
                          size="small"
                          startIcon={<PeopleIcon />}
                          variant="outlined"
                          onClick={() => openTicketsDialog(event.id)}
                          fullWidth
                        >
                          Manage Tickets
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ShareIcon />}
                          variant="outlined"
                          onClick={() => handleShareEvent(event.id)}
                          fullWidth
                        >
                          Share Event
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          variant="text"
                          color="error"
                          onClick={() => handleDeleteEvent(event.id)}
                          fullWidth
                        >
                          Delete Event
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(31, 77, 92, 0.1)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Event Name</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Vendors</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2, textAlign: 'center' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow
                          key={event.id}
                          sx={{
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <EventIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                              <Typography sx={{ fontWeight: 500 }}>{event.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            {new Date(event.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip
                              label={event.status}
                              size="small"
                              color={event.status === 'confirmed' ? 'success' : event.status === 'pending' ? 'warning' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2 }}>
                            <Chip label={`${event.vendors} vendors`} variant="outlined" size="small" />
                          </TableCell>
                          <TableCell sx={{ py: 2, textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                variant="text"
                                onClick={() => handleEditEvent(event)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                variant="text"
                                color="error"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                size="small"
                                startIcon={<PeopleIcon />}
                                variant="outlined"
                                onClick={() => openTicketsDialog(event.id)}
                              >
                                Manage Tickets
                              </Button>
                              <Button
                                size="small"
                                startIcon={<ShareIcon />}
                                variant="outlined"
                                onClick={() => handleShareEvent(event.id)}
                              >
                                Share
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Bookings Section */}
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                  Service Bookings
                </Typography>

                {bookings.length === 0 ? (
                  <Paper
                    sx={{
                      textAlign: 'center',
                      py: 8,
                      borderRadius: 2,
                    }}
                  >
                    <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                    <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                      No service bookings yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      Browse vendors and book services to see them here
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/browse-vendors')}
                    >
                      Browse Vendors
                    </Button>
                  </Paper>
                ) : isMobile ? (
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    {bookings.map((booking) => (
                      <Paper
                        key={booking.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{booking.service_title}</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              {booking.vendor_name}
                            </Typography>
                          </Box>
                          <Chip
                            label={booking.status}
                            size="small"
                            color={
                              booking.status === 'confirmed'
                                ? 'success'
                                : booking.status === 'pending'
                                ? 'warning'
                                : booking.status === 'completed'
                                ? 'info'
                                : 'error'
                            }
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ mt: 1.5, display: 'grid', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Booking Date: {new Date(booking.booking_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Notes: {booking.notes || 'No notes'}
                          </Typography>
                        </Box>
                        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => navigate(`/messaging?vendorId=${booking.vendor_id}`)}
                            fullWidth
                          >
                            Message Vendor
                          </Button>
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleCancelBooking(booking.id)}
                              fullWidth
                            >
                              Cancel Booking
                            </Button>
                          )}
                          {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              onClick={() => handleOpenReviewDialog(booking)}
                              fullWidth
                            >
                              Leave Review
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <Table>
                      <TableHead sx={{ backgroundColor: 'rgba(31, 77, 92, 0.1)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Service</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Vendor</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Booking Date</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 2 }}>Notes</TableCell>
                          <TableCell sx={{ fontWeight: 600, py: 2, textAlign: 'center' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow
                            key={booking.id}
                            sx={{
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              <Typography sx={{ fontWeight: 500 }}>{booking.service_title}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Typography>{booking.vendor_name}</Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              {new Date(booking.booking_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Chip
                                label={booking.status}
                                size="small"
                                color={
                                  booking.status === 'confirmed'
                                    ? 'success'
                                    : booking.status === 'pending'
                                    ? 'warning'
                                    : booking.status === 'completed'
                                    ? 'info'
                                    : 'error'
                                }
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {booking.notes || 'No notes'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 2, textAlign: 'center', display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => navigate(`/messaging?vendorId=${booking.vendor_id}`)}
                              >
                                Message
                              </Button>
                              {(booking.status === 'pending' || booking.status === 'confirmed') && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleCancelBooking(booking.id)}
                                >
                                  Cancel
                                </Button>
                              )}
                              {booking.status === 'completed' && !reviewedBookings.includes(booking.id) && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleOpenReviewDialog(booking)}
                                  sx={{ ml: 1 }}
                                >
                                  Leave Review
                                </Button>
                              )}
                            </TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
                            {/* Review Dialog */}
              <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Leave a Review</DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                  {reviewError && <Alert severity="error" sx={{ mb: 2 }}>{reviewError}</Alert>}
                  {reviewSuccess && <Alert severity="success" sx={{ mb: 2 }}>{reviewSuccess}</Alert>}
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {reviewBooking?.service_title} - {reviewBooking?.vendor_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography>Rating:</Typography>
                    <Rating
                      value={reviewRating}
                      onChange={(_, value) => setReviewRating(value)}
                      size="large"
                    />
                  </Box>
                  <TextField
                    label="Comment (optional)"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={4}
                  />
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setReviewDialogOpen(false)} disabled={reviewSubmitting}>Cancel</Button>
                  <Button onClick={handleSubmitReview} variant="contained" disabled={reviewSubmitting || !reviewRating}>
                    {reviewSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </DialogActions>
              </Dialog>
              <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  {editingEventId ? 'Edit Event' : 'Create New Event'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, maxHeight: '70vh', overflowY: 'auto' }}>
                  <TextField
                    fullWidth
                    label="Event Name"
                    placeholder="Enter event name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    margin="normal"
                  />
                  <TextField
                    fullWidth
                    label="Event Date"
                    type="datetime-local"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Event Type</InputLabel>
                    <Select
                      value={newEvent.type}
                      label="Event Type"
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    >
                      <MenuItem value="wedding">Wedding</MenuItem>
                      <MenuItem value="birthday">Birthday</MenuItem>
                      <MenuItem value="corporate">Corporate</MenuItem>
                      <MenuItem value="conference">Conference</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Location"
                    placeholder="Enter event location"
                    inputRef={locationInputRef}
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value, latitude: '', longitude: '' })}
                    margin="normal"
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: -0.5 }}>
                    Search for a venue or full address so the event page can drop an exact map pin.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Description"
                    placeholder="Enter event description"
                    multiline
                    minRows={2}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    margin="normal"
                  />
                  
                  {/* Image Upload Section */}
                  <Box sx={{ mt: 3, mb: 0 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#414958', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📸 Event Image <Typography variant="caption" sx={{ fontWeight: 400, color: '#999' }}>(Optional)</Typography>
                    </Typography>
                    
                    {!imagePreview ? (
                      <Box
                        sx={{
                          border: '2.5px dashed #414958',
                          borderRadius: '16px',
                          padding: '32px 20px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                          backgroundColor: 'rgba(65, 73, 88, 0.06)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            backgroundColor: 'rgba(65, 73, 88, 0.12)',
                            borderColor: '#2B3240',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(65, 73, 88, 0.14)',
                          },
                          '&:active': {
                            transform: 'translateY(0px)',
                          }
                        }}
                        component="label"
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        <CloudUploadIcon sx={{ fontSize: '3rem', color: '#414958', mb: 1.5, display: 'block' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#414958', mb: 0.75, fontSize: '1rem' }}>
                          Click to upload image
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666', display: 'block', fontSize: '0.875rem' }}>
                          or drag and drop • JPG, PNG, GIF, WebP • Max 5MB
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '2px solid #414958',
                          backgroundColor: 'background.paper',
                          boxShadow: '0 4px 16px rgba(65, 73, 88, 0.18)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Box sx={{ position: 'relative', paddingTop: '62.5%', backgroundColor: 'action.hover' }}>
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                        <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: '#414958', mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {imageFile?.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999', display: 'block', fontWeight: 500 }}>
                                {((imageFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                              </Typography>
                            </Box>
                            <Button 
                              size="small"
                              variant="contained"
                              startIcon={<CloseIcon sx={{ fontSize: '1.1rem' }} />}
                              onClick={clearImage}
                              sx={{
                                backgroundColor: '#D32F2F',
                                color: '#fff',
                                fontSize: '0.8rem',
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: '8px',
                                padding: '6px 12px',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                  backgroundColor: '#B71C1C',
                                }
                              }}
                            >
                              Remove
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {imageError && (
                      <Alert 
                        severity="error" 
                        sx={{ mt: 2, fontWeight: 500, borderRadius: '12px', backgroundColor: 'rgba(211, 47, 47, 0.08)', borderLeft: '4px solid #D32F2F' }}
                        onClose={() => setImageError(null)}
                      >
                        {imageError}
                      </Alert>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEvent}
                    variant="contained"
                    sx={{ textTransform: 'none', backgroundColor: '#414958', '&:hover': { backgroundColor: '#2B3240' } }}
                  >
                    {editingEventId ? 'Update Event' : 'Create Event'}
                  </Button>
                </DialogActions>
              </Dialog>
              {/* Tickets Dialog */}
              <Dialog open={ticketsDialogOpen} onClose={closeTicketsDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Manage Tickets</DialogTitle>
                <DialogContent>
                  {ticketLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {currentEventTickets.length === 0 ? (
                        <Alert severity="info">No tickets yet for this event.</Alert>
                      ) : (
                        <Box sx={{ display: 'grid', gap: 1 }}>
                          {currentEventTickets.map(t => (
                            <Paper key={t.id} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography sx={{ fontWeight: 600 }}>{t.ticket_type}</Typography>
                                <Typography variant="body2">Price: ${t.price} • Sold: {t.sold}/{t.quantity}</Typography>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      )}

                      <Box sx={{ mt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', pt: 2 }}>
                        <Typography sx={{ fontWeight: 700, mb: 1 }}>Create Ticket</Typography>
                        <TextField fullWidth label="Ticket Type" value={newTicket.ticket_type} onChange={e => setNewTicket({...newTicket, ticket_type: e.target.value})} margin="dense" />
                        <TextField fullWidth label="Price" value={newTicket.price} onChange={e => setNewTicket({...newTicket, price: e.target.value})} margin="dense" type="number" />
                        <TextField fullWidth label="Quantity" value={newTicket.quantity} onChange={e => setNewTicket({...newTicket, quantity: e.target.value})} margin="dense" type="number" />
                        <DialogActions>
                          <Button onClick={closeTicketsDialog}>Close</Button>
                          <Button onClick={() => handleCreateTicket()} variant="contained">Create Ticket</Button>
                        </DialogActions>
                      </Box>
                    </Box>
                  )}
                </DialogContent>
              </Dialog>
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default OrganizerDashboard


