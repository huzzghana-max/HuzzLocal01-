import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Alert,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import DashboardSidebar from '../components/DashboardSidebar'

interface PendingService {
  id: number
  vendor_id: number
  title: string
  description: string
  category: string
  price: number
  image?: string
  duration?: string
  availability?: string
  phone?: string
  location?: string
  created_at: string
  vendor_name: string
  vendor_email: string
}

const AdminServiceApproval: React.FC = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<PendingService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [selectedService, setSelectedService] = useState<PendingService | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    console.log('AdminServiceApproval mounted')
    const userStr = localStorage.getItem('user')
    console.log('User from localStorage:', userStr)
    
    if (!userStr) {
      console.log('No user found, redirecting to signin')
      navigate('/signin')
      return
    }

    const user = JSON.parse(userStr)
    console.log('Parsed user:', user)
    
    if (user.role !== 'admin') {
      console.log('User is not admin, redirecting. Role:', user.role)
      navigate('/admin-dashboard')
      return
    }

    console.log('User is admin, setting current user and fetching services')
    setCurrentUser(user)
    
    // Fetch pending services
    const loadServices = async () => {
      try {
        console.log('Starting loadServices')
        setLoading(true)
        setError('')
        const token = localStorage.getItem('token')
        console.log('Token from localStorage:', token ? 'exists' : 'missing')
        
        if (!token) {
          const errorMsg = 'No authentication token found'
          console.error(errorMsg)
          setError(errorMsg)
          setLoading(false)
          return
        }
        
        console.log('Fetching from http://localhost:5000/api/admin/pending-services')
        const response = await api.get('/admin/pending-services', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        })
        console.log('Response received:', response.status, response.data)
        const data = Array.isArray(response.data) ? response.data : [response.data]
        console.log('Services array:', data)
        setServices(data)
        setError('')
      } catch (error: any) {
        console.error('Failed to fetch pending services:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load pending services'
        console.error('Error message:', errorMessage)
        setError(errorMessage)
        setServices([])
      } finally {
        setLoading(false)
      }
    }
    
    loadServices()
  }, [navigate])

  const handleApprove = async (service: PendingService) => {
    try {
      const token = localStorage.getItem('token')
      await api.put(
        `/admin/services/${service.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setServices(services.filter(s => s.id !== service.id))
      setDialogOpen(false)
      alert('Service approved successfully!')
    } catch (error: any) {
      alert(`Failed to approve service: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleDecline = async (service: PendingService) => {
    try {
      const token = localStorage.getItem('token')
      await api.delete(
        `/admin/services/${service.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setServices(services.filter(s => s.id !== service.id))
      setDialogOpen(false)
      alert('Service declined successfully!')
    } catch (error: any) {
      alert(`Failed to decline service: ${error.response?.data?.message || error.message}`)
    }
  }

  const handleViewDetails = (service: PendingService) => {
    setSelectedService(service)
    setDialogOpen(true)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      {currentUser && (
        <DashboardSidebar
          userRole={currentUser.role}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userImage={currentUser.profile_image}
          onLogout={() => {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            navigate('/signin')
          }}
        />
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: currentUser ? '280px' : 0 }, width: '100%' }}>
        <Box sx={{ p: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Service Approval Queue
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => {
                setLoading(true)
                const token = localStorage.getItem('token')
                api.get('/admin/pending-services', {
                  headers: { Authorization: `Bearer ${token}` },
                  timeout: 10000,
                }).then((response: any) => {
                  const data = Array.isArray(response.data) ? response.data : [response.data]
                  setServices(data)
                  setError('')
                }).catch((error: any) => {
                  setError(error.message)
                  setServices([])
                }).finally(() => {
                  setLoading(false)
                })
              }}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
              <CircularProgress />
            </Box>
          ) : services.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">No pending services to approve</Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#EEF2F8' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Service Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submitted</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {service.image && (
                            <Avatar src={service.image} alt={service.title} sx={{ width: 32, height: 32 }} />
                          )}
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {service.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Click to view details
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {service.vendor_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {service.vendor_email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={service.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, color: '#F19B7D' }}>
                          ${(typeof service.price === 'string' ? service.price : String(service.price))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(service.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleViewDetails(service)}
                            sx={{
                              background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            View & Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleDecline(service)}
                          >
                            Decline
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedService && (
          <>
            <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
              Service Details - {selectedService.title}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              {selectedService.image && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={selectedService.image}
                    alt={selectedService.title}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      maxHeight: '300px',
                      borderRadius: '8px',
                    }}
                  />
                </Box>
              )}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                  Provider
                </Typography>
                <Typography variant="body2">{selectedService.vendor_name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedService.vendor_email}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                  Category
                </Typography>
                <Chip label={selectedService.category} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                  Price
                </Typography>
                <Typography variant="h6">${(typeof selectedService.price === 'string' ? selectedService.price : String(selectedService.price))}</Typography>
              </Box>
              {selectedService.duration && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                    Duration
                  </Typography>
                  <Typography variant="body2">{selectedService.duration}</Typography>
                </Box>
              )}
              {selectedService.availability && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                    Availability
                  </Typography>
                  <Typography variant="body2">{selectedService.availability}</Typography>
                </Box>
              )}
              {selectedService.phone && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                    Phone
                  </Typography>
                  <Typography variant="body2">{selectedService.phone}</Typography>
                </Box>
              )}
              {selectedService.location && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                    Location
                  </Typography>
                  <Typography variant="body2">{selectedService.location}</Typography>
                </Box>
              )}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F19B7D', mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedService.description}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)} variant="outlined">
                Close
              </Button>
              <Button
                onClick={() => handleDecline(selectedService)}
                variant="outlined"
                color="error"
              >
                Decline Service
              </Button>
              <Button
                onClick={() => handleApprove(selectedService)}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                }}
              >
                Approve Service
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default AdminServiceApproval

