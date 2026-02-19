import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  TextField,
  Fade,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import PersonIcon from '@mui/icons-material/Person'
import PaymentIcon from '@mui/icons-material/Payment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EventIcon from '@mui/icons-material/Event'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import api from '../../api'
import DashboardSidebar from '../../components/DashboardSidebar'
import { StatCard, DashboardHeader } from '../../components/DashboardComponents'

interface User {
  id: number
  name: string
  email: string
  role: 'organizer' | 'provider' | 'admin'
  created_at?: string
}

interface Event {
  id: number
  name: string
  description: string
  date: string
  location: string
  type: string
  organizer_id: number
  organizer_name: string
  organizer_email: string
  guest_count?: number
  budget?: number
  status: 'pending' | 'draft' | 'published' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled'
  created_at: string
  image_url?: string
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditRoleDialog, setOpenEditRoleDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [openEventDialog, setOpenEventDialog] = useState(false)
  const [openDeleteEventDialog, setOpenDeleteEventDialog] = useState(false)
  const [openEditEventDialog, setOpenEditEventDialog] = useState(false)
  const [filterRole, setFilterRole] = useState<'all' | 'organizer' | 'provider' | 'admin'>('all')
  const [filterEventStatus, setFilterEventStatus] = useState<string>('all')
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [eventSearchQuery, setEventSearchQuery] = useState('')

  // Form states for creating new user
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'organizer' as 'organizer' | 'provider' | 'admin',
  })

  // Form state for editing event
  const [editEventData, setEditEventData] = useState<Partial<Event>>({})

  // Form state for editing role
  const [newRole, setNewRole] = useState<'organizer' | 'provider' | 'admin'>('organizer')
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [updatingEvent, setUpdatingEvent] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [pendingServicesCount, setPendingServicesCount] = useState(0)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const parsedUser = JSON.parse(userStr)
      if (parsedUser.role !== 'admin') {
        setLoading(false)
        navigate('/signin')
        return
      }
    } else {
      setLoading(false)
      navigate('/signin')
      return
    }
    fetchUsers()
    fetchEvents()
    fetchPendingServices()
  }, [navigate])

  const fetchPendingServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/pending-services', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingServicesCount(response.data.length)
    } catch (err: any) {
      console.error('Error fetching pending services:', err)
      setPendingServicesCount(0)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        setLoading(false)
        return
      }
      const response = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No authentication token found')
        return
      }
      const response = await api.get('/admin/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(response.data)
    } catch (err: any) {
      console.error('Error fetching events:', err)
      setEvents([])
    }
  }

  const handleOpenUserDialog = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setOpenUserDialog(true)
  }

  const handleCloseUserDialog = () => {
    setOpenUserDialog(false)
    setSelectedUser(null)
  }

  const handleOpenEventDialog = (event: Event) => {
    setSelectedEvent(event)
    setOpenEventDialog(true)
  }

  const handleCloseEventDialog = () => {
    setOpenEventDialog(false)
    setSelectedEvent(null)
  }

  const handleOpenCreateDialog = () => {
    setNewUserData({ name: '', email: '', password: '', role: 'organizer' })
    setError('')
    setOpenCreateDialog(true)
  }

  const handleCloseCreateDialog = () => {
    setOpenCreateDialog(false)
    setError('')
  }

  const handleCreateUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      setError('All fields are required')
      return
    }

    setCreatingUser(true)
    try {
      await api.post('/admin/users', newUserData)
      setSuccessMessage(`${newUserData.role} user created successfully!`)
      setOpenCreateDialog(false)
      fetchUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleOpenEditRoleDialog = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setOpenEditRoleDialog(true)
    setOpenUserDialog(false)
  }

  const handleCloseEditRoleDialog = () => {
    setOpenEditRoleDialog(false)
    setError('')
  }

  const handleUpdateRole = async () => {
    if (!selectedUser || newRole === selectedUser.role) {
      setError('Please select a different role')
      return
    }

    setUpdatingRole(true)
    try {
      await api.put(`/admin/users/${selectedUser.id}`, { role: newRole })
      setSuccessMessage(`User role updated to ${newRole}!`)
      setOpenEditRoleDialog(false)
      fetchUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role')
    } finally {
      setUpdatingRole(false)
    }
  }

  const handleOpenDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setOpenDeleteDialog(true)
    setOpenUserDialog(false)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
    setError('')
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setDeletingUser(true)
    try {
      await api.delete(`/admin/users/${selectedUser.id}`)
      setSuccessMessage(`User ${selectedUser.name} deleted successfully!`)
      setOpenDeleteDialog(false)
      fetchUsers()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user')
    } finally {
      setDeletingUser(false)
    }
  }

  const handleOpenEditEventDialog = (event: Event) => {
    setSelectedEvent(event)
    setEditEventData({ ...event })
    setOpenEventDialog(false)
    setOpenEditEventDialog(true)
  }

  const handleCloseEditEventDialog = () => {
    setOpenEditEventDialog(false)
    setEditEventData({})
    setError('')
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return

    setUpdatingEvent(true)
    try {
      await api.put(`/admin/events/${selectedEvent.id}`, editEventData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setSuccessMessage('Event updated successfully!')
      setOpenEditEventDialog(false)
      fetchEvents()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update event')
    } finally {
      setUpdatingEvent(false)
    }
  }

  const handleOpenDeleteEventDialog = (event: Event) => {
    setSelectedEvent(event)
    setOpenEventDialog(false)
    setOpenDeleteEventDialog(true)
  }

  const handleCloseDeleteEventDialog = () => {
    setOpenDeleteEventDialog(false)
    setError('')
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    setDeletingEvent(true)
    try {
      await api.delete(`/admin/events/${selectedEvent.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      setSuccessMessage(`Event "${selectedEvent.name}" deleted successfully!`)
      setOpenDeleteEventDialog(false)
      fetchEvents()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event')
    } finally {
      setDeletingEvent(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  // Filter and search users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  // Filter and search events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                         event.organizer_name.toLowerCase().includes(eventSearchQuery.toLowerCase())
    const matchesStatus = filterEventStatus === 'all' || event.status === filterEventStatus
    return matchesSearch && matchesStatus
  })

  // Calculate stats
  const totalUsers = users.length
  const organizersCount = users.filter(u => u.role === 'organizer').length
  const providersCount = users.filter(u => u.role === 'provider').length
  const adminsCount = users.filter(u => u.role === 'admin').length
  const totalEvents = events.length

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <DashboardSidebar
        userRole="admin"
        userName="Admin User"
        userEmail="admin@huzz.com"
        notifications={0}
        messages={pendingServicesCount}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, mt: { xs: 60, md: 0 } }}>
        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {/* Header */}
          <DashboardHeader
            title="Admin Dashboard"
            subtitle="System management and platform oversight"
            actionButton={
              <Box sx={{ display: 'flex', gap: 2 }}>
                {currentTab === 0 && (
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={handleOpenCreateDialog}
                    sx={{
                      background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '12px',
                      py: 1,
                      px: 3,
                      boxShadow: '0 4px 15px rgba(14, 59, 38, 0.3)',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(14, 59, 38, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Add User
                  </Button>
                )}
              </Box>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 3, mb: 5 }}>
                <StatCard title="Total Users" value={totalUsers} icon={<PersonIcon />} color="primary" change={12} />
                <StatCard title="Organizers" value={organizersCount} icon={<PersonIcon />} color="secondary" change={8} />
                <StatCard title="Service Providers" value={providersCount} icon={<PaymentIcon />} color="success" change={15} />
                <StatCard title="Admins" value={adminsCount} icon={<AdminPanelSettingsOutlinedIcon />} color="warning" change={-2} />
                <Paper
                  onClick={() => navigate('/admin/service-approval')}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: '2px solid #ff8c00',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)',
                      transform: 'translateY(-4px)',
                      borderColor: '#ff6b35',
                    },
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#ff8c00', mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    Service Approvals
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff8c00', mb: 1 }}>
                    {pendingServicesCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pending Review
                  </Typography>
                </Paper>
              </Box>

              {/* Tab Navigation */}
              <Paper sx={{ mb: 4 }}>
                <Tabs
                  value={currentTab}
                  onChange={(_, newValue) => setCurrentTab(newValue)}
                  sx={{
                    borderBottom: '2px solid rgba(14, 59, 38, 0.1)',
                    background: 'linear-gradient(90deg, rgba(14, 59, 38, 0.04) 0%, rgba(184, 227, 197, 0.04) 100%)',
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 700,
                      color: '#666',
                      transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        color: '#0E3B26',
                      },
                    },
                    '& .MuiTab-root.Mui-selected': {
                      color: '#0E3B26',
                      fontWeight: 800,
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#0E3B26',
                      height: '3px',
                      borderRadius: '2px',
                    },
                  }}
                >
                  <Tab label="👥 Users" />
                  <Tab label={`📅 Events (${totalEvents})`} />
                </Tabs>
              </Paper>

              {/* Tab Content */}
              <Fade in={true} timeout={500}>
                {currentTab === 0 ? (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    User Management
                  </Typography>

                  {/* Search and Filter Bar */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 200px' }, gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value as any)}
                      SelectProps={{ native: true }}
                      sx={{ borderRadius: 2 }}
                    >
                      <option value="all">All Roles</option>
                      <option value="organizer">Organizers</option>
                      <option value="provider">Providers</option>
                      <option value="admin">Admins</option>
                    </TextField>
                  </Box>

                  {/* Users Table */}
                  {filteredUsers.length === 0 ? (
                    <Paper
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        borderRadius: 2,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        No users found
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
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Join Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF', textAlign: 'center' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredUsers.map((user) => (
                            <TableRow
                              key={user.id}
                              sx={{
                                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  bgcolor: 'rgba(184, 227, 197, 0.1)',
                                  boxShadow: '0 2px 8px rgba(14, 59, 38, 0.08) inset',
                                },
                              }}
                            >
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{
                                    background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                                    fontWeight: 700,
                                    boxShadow: '0 2px 8px rgba(14, 59, 38, 0.3)',
                                  }}>
                                    {user.name[0]}
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {user.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2, color: 'text.secondary' }}>
                                {user.email}
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Chip
                                  label={user.role}
                                  size="small"
                                  sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, rgba(14, 59, 38, 0.15) 0%, rgba(184, 227, 197, 0.15) 100%)',
                                    color: '#0E3B26',
                                    border: '1.5px solid #B8E3C5',
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 2, color: 'text.secondary', fontSize: '0.9rem' }}>
                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ py: 2, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    variant="text"
                                    onClick={() => handleOpenUserDialog(user)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    variant="text"
                                    color="error"
                                    onClick={() => handleOpenDeleteDialog(user)}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Results Info */}
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Showing {filteredUsers.length} of {users.length} users
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                    Event Management
                  </Typography>

                  {/* Search and Filter Bar */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px' }, gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      placeholder="Search by event name or organizer..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        },
                      }}
                    />
                    <TextField
                      select
                      value={filterEventStatus}
                      onChange={(e) => setFilterEventStatus(e.target.value as any)}
                      SelectProps={{ native: true }}
                      sx={{ borderRadius: 2 }}
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending">Pending</option>
                      <option value="published">Published</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </TextField>
                  </Box>

                  {/* Events Table */}
                  {filteredEvents.length === 0 ? (
                    <Paper
                      sx={{
                        textAlign: 'center',
                        py: 6,
                        borderRadius: 2,
                      }}
                    >
                      <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        No events found
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
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Event</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Organizer</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, py: 2.5, color: '#FFFFFF', textAlign: 'center' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredEvents.map((event) => (
                            <TableRow
                              key={event.id}
                              sx={{
                                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  bgcolor: 'rgba(184, 227, 197, 0.1)',
                                  boxShadow: '0 2px 8px rgba(14, 59, 38, 0.08) inset',
                                },
                              }}
                            >
                              <TableCell sx={{ py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <EventIcon sx={{ color: '#0E3B26', fontSize: 20 }} />
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {event.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, opacity: 0.7 }}>
                                      <LocationOnIcon sx={{ fontSize: 14 }} />
                                      <Typography variant="caption">
                                        {event.location}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {event.organizer_name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {event.organizer_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2, color: 'text.secondary', fontSize: '0.9rem' }}>
                                {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Chip
                                  label={event.status}
                                  size="small"
                                  sx={{
                                    textTransform: 'capitalize',
                                    fontWeight: 700,
                                    background: event.status === 'published' || event.status === 'confirmed' 
                                      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)'
                                      : event.status === 'cancelled'
                                      ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(229, 57, 53, 0.15) 100%)'
                                      : 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 167, 38, 0.15) 100%)',
                                    color: event.status === 'published' || event.status === 'confirmed'
                                      ? '#2e7d32'
                                      : event.status === 'cancelled'
                                      ? '#c62828'
                                      : '#e65100',
                                    border: `1.5px solid ${event.status === 'published' || event.status === 'confirmed'
                                      ? '#81c784'
                                      : event.status === 'cancelled'
                                      ? '#ef5350'
                                      : '#ffb74d'}`,
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 2, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    variant="text"
                                    onClick={() => handleOpenEventDialog(event)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<EditIcon />}
                                    variant="text"
                                    onClick={() => handleOpenEditEventDialog(event)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    variant="text"
                                    color="error"
                                    onClick={() => handleOpenDeleteEventDialog(event)}
                                  >
                                    Delete
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Results Info */}
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Showing {filteredEvents.length} of {events.length} events
                    </Typography>
                  </Box>
                </Box>
              )}
              </Fade>

              {/* User Details Dialog */}
              <Dialog open={openUserDialog} onClose={handleCloseUserDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  User Profile
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {selectedUser && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                      {/* Avatar */}
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: 'primary.main',
                          fontSize: '2rem',
                          fontWeight: 700,
                        }}
                      >
                        {selectedUser.name[0]}
                      </Avatar>

                      {/* User Info */}
                      <Box sx={{ width: '100%', textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {selectedUser.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                          {selectedUser.email}
                        </Typography>
                        <Chip
                          label={selectedUser.role}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Box>

                      {/* Details */}
                      <Box sx={{ width: '100%', p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                            Join Date
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                            Account Status
                          </Typography>
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            variant="filled"
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseUserDialog} sx={{ textTransform: 'none' }}>
                    Close
                  </Button>
                  <Button
                    onClick={() => handleOpenEditRoleDialog(selectedUser!)}
                    startIcon={<EditIcon />}
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                  >
                    Change Role
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Create User Dialog */}
              <Dialog open={openCreateDialog} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  Create New User
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={newUserData.name}
                      onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={newUserData.role}
                        label="Role"
                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                      >
                        <MenuItem value="organizer">Organizer</MenuItem>
                        <MenuItem value="provider">Provider</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseCreateDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    variant="contained"
                    disabled={creatingUser}
                    sx={{ textTransform: 'none' }}
                  >
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Edit Role Dialog */}
              <Dialog open={openEditRoleDialog} onClose={handleCloseEditRoleDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  Change User Role
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  {selectedUser && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          User: {selectedUser.name}
                        </Typography>
                        <Typography variant="body2">
                          {selectedUser.email}
                        </Typography>
                      </Box>

                      <FormControl fullWidth>
                        <InputLabel>New Role</InputLabel>
                        <Select
                          value={newRole}
                          label="New Role"
                          onChange={(e) => setNewRole(e.target.value as any)}
                        >
                          <MenuItem value="organizer">Organizer</MenuItem>
                          <MenuItem value="provider">Provider</MenuItem>
                          <MenuItem value="admin">Admin</MenuItem>
                        </Select>
                      </FormControl>

                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          Current role: <strong>{selectedUser.role}</strong>
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseEditRoleDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateRole}
                    variant="contained"
                    disabled={updatingRole}
                    sx={{ textTransform: 'none' }}
                  >
                    {updatingRole ? 'Updating...' : 'Update Role'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
                  Delete User
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  {selectedUser && (
                    <Box>
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        Are you sure you want to delete <strong>{selectedUser.name}</strong>?
                      </Typography>

                      <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          User Details
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Name:</strong> {selectedUser.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Email:</strong> {selectedUser.email}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Role:</strong> {selectedUser.role}
                        </Typography>
                      </Box>

                      <Alert severity="warning">
                        This action cannot be undone. The user account will be permanently deleted.
                      </Alert>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseDeleteDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteUser}
                    variant="contained"
                    color="error"
                    disabled={deletingUser}
                    sx={{ textTransform: 'none' }}
                  >
                    {deletingUser ? 'Deleting...' : 'Delete User'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Event Details Dialog */}
              <Dialog open={openEventDialog} onClose={handleCloseEventDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  Event Details
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {selectedEvent && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {/* Event Name */}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          Event Name
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedEvent.name}
                        </Typography>
                      </Box>

                      {/* Organizer */}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          Organizer
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedEvent.organizer_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {selectedEvent.organizer_email}
                        </Typography>
                      </Box>

                      {/* Date & Location */}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          Date & Location
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          {selectedEvent.location}
                        </Typography>
                      </Box>

                      {/* Description */}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          Description
                        </Typography>
                        <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                          {selectedEvent.description || 'No description provided'}
                        </Typography>
                      </Box>

                      {/* Status */}
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                          Status
                        </Typography>
                        <Chip
                          label={selectedEvent.status}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            fontWeight: 700,
                            background: selectedEvent.status === 'published' || selectedEvent.status === 'confirmed'
                              ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)'
                              : selectedEvent.status === 'cancelled'
                              ? 'linear-gradient(135deg, rgba(244, 67, 54, 0.15) 0%, rgba(229, 57, 53, 0.15) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(255, 167, 38, 0.15) 100%)',
                            color: selectedEvent.status === 'published' || selectedEvent.status === 'confirmed'
                              ? '#2e7d32'
                              : selectedEvent.status === 'cancelled'
                              ? '#c62828'
                              : '#e65100',
                            border: `1.5px solid ${selectedEvent.status === 'published' || selectedEvent.status === 'confirmed'
                              ? '#81c784'
                              : selectedEvent.status === 'cancelled'
                              ? '#ef5350'
                              : '#ffb74d'}`,
                          }}
                        />
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseEventDialog} sx={{ textTransform: 'none' }}>
                    Close
                  </Button>
                  <Button
                    onClick={() => handleOpenEditEventDialog(selectedEvent!)}
                    startIcon={<EditIcon />}
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                  >
                    Edit Event
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Edit Event Dialog */}
              <Dialog open={openEditEventDialog} onClose={handleCloseEditEventDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                  Edit Event
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      value={editEventData.name}
                      onChange={(e) => setEditEventData({ ...editEventData, name: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      rows={4}
                      value={editEventData.description}
                      onChange={(e) => setEditEventData({ ...editEventData, description: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Location"
                      value={editEventData.location}
                      onChange={(e) => setEditEventData({ ...editEventData, location: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Event Type"
                      value={editEventData.type}
                      onChange={(e) => setEditEventData({ ...editEventData, type: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Date & Time"
                      type="datetime-local"
                      value={editEventData.date}
                      onChange={(e) => setEditEventData({ ...editEventData, date: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editEventData.status}
                        label="Status"
                        onChange={(e) => setEditEventData({ ...editEventData, status: e.target.value as any })}
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="published">Published</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="ongoing">Ongoing</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseEditEventDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateEvent}
                    variant="contained"
                    disabled={updatingEvent}
                    sx={{ textTransform: 'none' }}
                  >
                    {updatingEvent ? 'Updating...' : 'Update Event'}
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Delete Event Confirmation Dialog */}
              <Dialog open={openDeleteEventDialog} onClose={handleCloseDeleteEventDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>
                  Delete Event
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                  {selectedEvent && (
                    <Box>
                      <Typography variant="body1" sx={{ mb: 3 }}>
                        Are you sure you want to delete <strong>{selectedEvent.name}</strong>?
                      </Typography>

                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 1 }}>
                          Event Details
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Name:</strong> {selectedEvent.name}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Organizer:</strong> {selectedEvent.organizer_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>

                      <Alert severity="warning">
                        This action cannot be undone. The event will be permanently deleted from the system.
                      </Alert>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                  <Button onClick={handleCloseDeleteEventDialog} sx={{ textTransform: 'none' }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteEvent}
                    variant="contained"
                    color="error"
                    disabled={deletingEvent}
                    sx={{ textTransform: 'none' }}
                  >
                    {deletingEvent ? 'Deleting...' : 'Delete Event'}
                  </Button>
                </DialogActions>
              </Dialog>
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AdminDashboard