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

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [openUserDialog, setOpenUserDialog] = useState(false)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditRoleDialog, setOpenEditRoleDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [filterRole, setFilterRole] = useState<'all' | 'organizer' | 'provider' | 'admin'>('all')
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Form states for creating new user
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'organizer' as 'organizer' | 'provider' | 'admin',
  })

  // Form state for editing role
  const [newRole, setNewRole] = useState<'organizer' | 'provider' | 'admin'>('organizer')
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingRole, setUpdatingRole] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
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
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching users:', err)
      // Don't fall back to mock data - show error instead
      setUsers([])
      setLoading(false)
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

  // Calculate stats
  const totalUsers = users.length
  const organizersCount = users.filter(u => u.role === 'organizer').length
  const providersCount = users.filter(u => u.role === 'provider').length
  const adminsCount = users.filter(u => u.role === 'admin').length

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <DashboardSidebar
        userRole="admin"
        userName="Admin User"
        userEmail="admin@huzz.com"
        notifications={5}
        messages={3}
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

              {/* User Management Section */}
              <Fade in={true} timeout={900}>
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
            </>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AdminDashboard