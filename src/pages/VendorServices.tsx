/*
  File: src/pages/VendorServices.tsx
  Purpose: Provider-facing page to create, edit and manage services provided by a vendor.

  Major responsibilities:
  - Fetch authenticated vendor services (`GET /api/vendor/services`) and normalize images
  - Create/update services (multipart uploads -> `/api/vendor/services`)
  - Display `approval_status` and `is_approved` to inform provider (pending/approved/declined)
  - Show preview for uploaded images (converts `/uploads/...` to absolute URL)

  Where it affects the UI / routes:
  - Route: `/vendor-services`
  - Interacts with backend endpoints used by providers; changes here affect what appears
    in the provider dashboard and what gets submitted for admin approval.

  Important notes:
  - Image URLs are normalized on fetch so UI always receives absolute URLs.
  - New services are created with `approval_status='pending'` (server-side enforced).
*/
import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Paper,
  Button,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import SaveIcon from '@mui/icons-material/Save'
import DashboardSidebar from '../components/DashboardSidebar'

interface Service {
  id: number
  title: string
  description: string
  category: string
  price: number
  image?: string
  phone?: string
  location?: string
  latitude?: number
  longitude?: number
  duration?: string
  availability?: string
  is_approved?: boolean
  approval_status?: 'pending' | 'approved' | 'declined'
}

interface User {
  id: number
  name: string
  email: string
  role: string
  profile_image?: string
}

const VendorServices: React.FC = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [serviceImage, setServiceImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const locationInputRef = useRef<HTMLInputElement | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Photography',
    price: 0,
    phone: '',
    location: '',
    latitude: '',
    longitude: '',
    duration: '1 hour',
    availability: 'Weekdays',
  })

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      navigate('/signin')
      return
    }
    const user = JSON.parse(userStr)
    setCurrentUser(user)
    if (user.role !== 'provider') {
      setLoading(false)
      navigate('/signin')
      return
    }
    fetchServices()
  }, [navigate])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        setErrorMessage('No authentication token found. Please log in again.')
        setLoading(false)
        navigate('/signin')
        return
      }
      const response = await api.get('/vendor/services')
      const apiHost = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
      const normalized = (response.data || []).map((s: any) => ({
        ...s,
        image: s.image && s.image.startsWith('/uploads/') ? `${apiHost}${s.image}` : s.image,
        phone: s.phone || '',
        location: s.location || '',
        latitude: s.latitude ? Number(s.latitude) : undefined,
        longitude: s.longitude ? Number(s.longitude) : undefined,
      }))
      setServices(normalized)
      setErrorMessage('')
    } catch (error: any) {
      console.error('Failed to fetch services:', error)
      console.error('Error response:', error.response?.data)
      console.error('Error status:', error.response?.status)
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setServiceImage(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | any>) => {
    const { name, value } = e.target
    setFormData((prev) => {
      if (name === 'price') {
        // Avoid NaN: return 0 if value is empty, otherwise parse as float
        return { ...prev, [name]: value === '' ? 0 : parseFloat(value) }
      }
      return { ...prev, [name]: value }
    })
  }

  // Google Places Autocomplete for location input
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const attach = () => {
      try {
        const google = (window as any).google
        if (!google || !google.maps || !google.maps.places) return
        if (!locationInputRef.current) return
        const autocomplete = new google.maps.places.Autocomplete(locationInputRef.current, { types: ['geocode'] })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const formatted = place.formatted_address || place.name || locationInputRef.current!.value
          const lat = place.geometry?.location?.lat && place.geometry.location.lat()
          const lng = place.geometry?.location?.lng && place.geometry.location.lng()
          setFormData((prev) => ({ ...prev, location: formatted, latitude: lat || '', longitude: lng || '' }))
        })
      } catch (err) {
        console.warn('Google autocomplete attach failed', err)
      }
    }

    if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
      attach()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = attach
    document.head.appendChild(script)
    return () => {
      // do not remove script to avoid breaking other pages
    }
  }, [])

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        title: service.title,
        description: service.description,
        category: service.category,
        price: service.price,
        phone: service.phone || '',
        location: service.location || '',
        latitude: String(service.latitude || ''),
        longitude: String(service.longitude || ''),
        duration: service.duration || '1 hour',
        availability: service.availability || 'Weekdays',
      })
      setImagePreview(service.image || '')
    } else {
      setEditingService(null)
      setFormData({
        title: '',
        description: '',
        category: 'Photography',
        price: 0,
        phone: '',
        location: '',
        latitude: '',
        longitude: '',
        duration: '1 hour',
        availability: 'Weekdays',
      })
      setImagePreview('')
    }
    setServiceImage(null)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingService(null)
    setServiceImage(null)
    setImagePreview('')
  }

  const handleSaveService = async () => {
    if (!formData.title || !formData.description || !formData.price) {
      setErrorMessage('Please fill in all required fields')
      return
    }

    try {
      const data = new FormData()
      data.append('title', formData.title)
      data.append('description', formData.description)
      data.append('category', formData.category)
      data.append('price', formData.price.toString())
      data.append('duration', formData.duration)
      data.append('availability', formData.availability)
      data.append('phone', formData.phone)
      data.append('location', formData.location)
      data.append('latitude', formData.latitude?.toString ? formData.latitude.toString() : '')
      data.append('longitude', formData.longitude?.toString ? formData.longitude.toString() : '')
      if (serviceImage) {
        data.append('image', serviceImage)
      }

      if (editingService) {
        await api.put(`/vendor/services/${editingService.id}`, data)
        setSuccessMessage('Service updated successfully!')
      } else {
        await api.post('/vendor/services', data)
        setSuccessMessage('Service created — pending admin approval.')
      }

      handleCloseDialog()
      fetchServices()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Failed to save service')
    }
  }

  const handleDeleteService = async (serviceId: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/vendor/services/${serviceId}`)
        setSuccessMessage('Service deleted successfully!')
        fetchServices()
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || 'Failed to delete service')
      }
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/signin')
  }

  const serviceCategories = ['Photography', 'Videography', 'Event Planning', 'Catering', 'Decoration', 'Entertainment', 'Other']
  const durationOptions = ['30 minutes', '1 hour', '2 hours', '4 hours', '8 hours', 'Full day', 'Custom']
  const availabilityOptions = ['Weekdays', 'Weekends', 'Both', 'Custom']

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      {currentUser && (
        <DashboardSidebar
          userRole={currentUser.role as 'admin' | 'organizer' | 'provider'}
          userName={currentUser.name}
          userEmail={currentUser.email}
          userImage={currentUser.profile_image}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: { xs: 0, md: '280px' }, width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, md: 4 }, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                My Services
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>Manage and showcase your professional services</Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                backgroundColor: '#F19B7D',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#DD8568' },
              }}
            >
              Add Service
            </Button>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
              {errorMessage}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress />
            </Box>
          ) : services.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <CloudUploadIcon sx={{ fontSize: 60, color: '#ddd', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                No services yet
              </Typography>
              <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                Create your first service to start getting bookings!
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
                sx={{
                  backgroundColor: '#F19B7D',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#DD8568' },
                }}
              >
                Create Your First Service
              </Button>
            </Paper>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
              {services.map((service) => (
                <Card key={service.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 2 }}>
                  {service.image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={service.image}
                      alt={service.title}
                      sx={{ objectFit: 'cover' }}

                    />
                  )}
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, flex: 1 }}>
                        {service.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenDialog(service)} sx={{ color: '#F19B7D' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteService(service.id)} sx={{ color: 'error.main' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={service.category}
                        size="small"
                        sx={{ alignSelf: 'flex-start', bgcolor: '#FCE9E2', color: '#F19B7D', fontWeight: 600 }}
                      />

                      <Chip
                        label={service.approval_status ? service.approval_status.toUpperCase() : (service.is_approved ? 'APPROVED' : 'PENDING')}
                        size="small"
                        color={service.approval_status === 'declined' ? 'error' : service.approval_status === 'approved' || service.is_approved ? 'success' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Typography sx={{ fontSize: '0.9rem', color: 'text.secondary', mb: 2, flex: 1 }}>
                      {service.description.length > 100 ? service.description.substring(0, 100) + '...' : service.description}
                    </Typography>

                    {/* Contact & Location */}
                    <Box sx={{ display: 'flex', gap: 2, color: 'text.secondary', mb: 2 }}>
                      {service.phone && <Box>📞 {service.phone}</Box>}
                      {service.location && <Box>📍 {service.location}</Box>}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, fontSize: '0.85rem', color: 'text.secondary', mb: 2 }}>
                      {service.duration && <Box>{service.duration}</Box>}
                      {service.availability && <Box>{service.availability}</Box>}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#F19B7D' }}>
                        ${service.price}
                      </Typography>
                      <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>per service</Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Add/Edit Service Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
          {editingService ? 'Edit Service' : 'Create New Service'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Service Image */}
          <Box sx={{ mb: 3 }}>
            {imagePreview && (
              <Box
                component="img"
                src={imagePreview}
                alt="Service preview"
                sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 2 }}
              />
            )}
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="service-image-input"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="service-image-input">
              <Button
                //onClick={setServiceImage}
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{
                  borderColor: '#F19B7D',
                  color: '#F19B7D',
                  textTransform: 'none',
                  fontWeight: 600,
                }}

              >
                {imagePreview ? 'Change Image' : 'Upload Service Image'}
              </Button>
            </label>
          </Box>

          {/* Service Title */}
          <TextField
            fullWidth
            label="Service Title"
            name="title"
            value={formData.title}
            onChange={handleFormChange}
            placeholder="e.g., Professional Photography Package"
            sx={{ mb: 2 }}
          />

          {/* Service Category */}
          <TextField
            fullWidth
            select
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleFormChange}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            {serviceCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </TextField>

          {/* Description */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            placeholder="Describe your service in detail..."
            sx={{ mb: 2 }}
          />

          {/* Price */}
          <TextField
            fullWidth
            label="Price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleFormChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          {/* Duration */}
          <TextField
            fullWidth
            select
            label="Duration"
            name="duration"
            value={formData.duration}
            onChange={handleFormChange}
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            {durationOptions.map((dur) => (
              <option key={dur} value={dur}>
                {dur}
              </option>
            ))}
          </TextField>

          {/* Availability */}
          <TextField
            fullWidth
            select
            label="Availability"
            name="availability"
            value={formData.availability}
            onChange={handleFormChange}
            SelectProps={{ native: true }}
          >
            {availabilityOptions.map((avail) => (
              <option key={avail} value={avail}>
                {avail}
              </option>
            ))}
          </TextField>

          {/* Phone */}
          <TextField
            fullWidth
            label="Contact Phone"
            name="phone"
            value={formData.phone}
            onChange={handleFormChange}
            placeholder="e.g., +1 555 123 4567"
            sx={{ mt: 2 }}
          />

          {/* Location (Google Places Autocomplete) */}
          <TextField
            fullWidth
            label="Location"
            name="location"
            inputRef={locationInputRef}
            id="service-location-input"
            value={formData.location}
            onChange={handleFormChange}
            placeholder="Search for address or business"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveService}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              backgroundColor: '#F19B7D',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: '#DD8568' },
            }}
          >
            {editingService ? 'Update' : 'Create'} Service
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VendorServices

