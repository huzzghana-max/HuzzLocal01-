/*
  File: src/pages/BrowseVendors.tsx
  Purpose: Modern vendor discovery page with advanced filtering, sorting, and view modes.

  Features:
  - Hero header with gradient background
  - Sticky filter section with search, category, and sort options
  - Grid and list view modes
  - Skeleton loaders during data fetch
  - Vendor cards with ratings, badges for top-rated
  - Beautiful empty state with reset button
  - Smooth animations and hover effects
  - Booking dialog with date/notes
*/
import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Button,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Rating,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import SearchIcon from '@mui/icons-material/Search'
import FilterListIcon from '@mui/icons-material/FilterList'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HomeIcon from '@mui/icons-material/Home'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import StarIcon from '@mui/icons-material/Star'
import api from '../api'

interface Vendor {
  id: number
  vendor_id?: number
  user_id?: number
  name: string
  service_type?: string
  business_name?: string
  description?: string
  hourly_rate?: number
  price?: string
  rating: number
  total_ratings?: number
  totalRatings?: number
  phone?: string
  email?: string
  location?: string
  image?: string
  verified?: boolean
  about?: string
  business?: string
  serviceType?: string
  contact?: {
    phone: string
    email: string
  }
  services?: string[]
  availability?: string
  availability_status?: string
}

const BrowseVendors: React.FC = () => {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('all')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openBookingDialog, setOpenBookingDialog] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' })
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'name'>('rating')

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        const response = await api.get('/approved-services')
        const servicesData = Array.isArray(response.data) ? response.data : [response.data]
        
        const apiHost = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '')
        const vendorsData = servicesData.map((service: any) => {
          const imageUrl = service.image ? (service.image.startsWith('/uploads/') ? `${apiHost}${service.image}` : service.image) : `https://i.pravatar.cc/150?img=${service.vendor_id}`;
          return {
            ...service,
            business: service.vendor_name,
            serviceType: service.category,
            totalRatings: service.totalRatings || 0,
            price: service.price ? `$${typeof service.price === 'string' ? service.price : service.price.toFixed(2)}/hr` : 'Contact for pricing',
            location: service.location || 'Not specified',
            image: imageUrl,
            verified: true,
            about: service.description || 'Professional service provider',
            contact: {
              phone: service.phone || 'Not provided',
              email: service.vendor_email || 'Not provided',
            },
            services: [service.title],
            availability: service.availability || 'Available',
          }
        })
        setVendors(vendorsData)
        setFilteredVendors(vendorsData)
      } catch (error) {
        console.error('Error fetching approved services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  useEffect(() => {
    let results = vendors

    if (searchQuery.trim()) {
      results = results.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vendor.business?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
          (vendor.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
      )
    }

    if (selectedServiceType !== 'all') {
      results = results.filter((vendor) => vendor.serviceType === selectedServiceType)
    }

    setFilteredVendors(results)
  }, [searchQuery, selectedServiceType, vendors])

  const getSortedVendors = (vendors: Vendor[]) => {
    const sorted = [...vendors]
    if (sortBy === 'rating') sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    else if (sortBy === 'price') sorted.sort((a, b) => {
      const aPrice = parseFloat(a.price?.replace('$', '') || '0')
      const bPrice = parseFloat(b.price?.replace('$', '') || '0')
      return aPrice - bPrice
    })
    else if (sortBy === 'name') sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return sorted
  }

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setOpenDetailDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDetailDialog(false)
    setSelectedVendor(null)
  }

  const fetchVendorAvailability = async (vendor: Vendor) => {
    try {
      setAvailabilityLoading(true)
      const vendorId = vendor.vendor_id || vendor.user_id
      if (!vendorId) {
        setBlockedDates([])
        return
      }
      const from = new Date().toISOString().split('T')[0]
      const toDate = new Date()
      toDate.setDate(toDate.getDate() + 120)
      const to = toDate.toISOString().split('T')[0]
      const response = await api.get(`/vendors/${vendorId}/availability-calendar`, {
        params: { from, to },
      })
      const dates = Array.isArray(response.data?.blockedDates) ? response.data.blockedDates : []
      setBlockedDates(dates)
    } catch (error) {
      console.error('Failed to fetch vendor availability:', error)
      setBlockedDates([])
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const handleBookClick = async () => {
    setOpenDetailDialog(false)
    setOpenBookingDialog(true)
    setBookingMessage({ type: '', text: '' })
    if (selectedVendor) {
      await fetchVendorAvailability(selectedVendor)
    }
  }

  const handleCloseBookingDialog = () => {
    setOpenBookingDialog(false)
    setBookingDate('')
    setBookingNotes('')
    setBookingMessage({ type: '', text: '' })
    setBlockedDates([])
  }

  const handleBookService = async () => {
    if (!bookingDate) {
      setBookingMessage({ type: 'error', text: 'Please select a booking date' })
      return
    }

    if (!selectedVendor) {
      setBookingMessage({ type: 'error', text: 'No service selected' })
      return
    }

    if (blockedDates.includes(bookingDate)) {
      setBookingMessage({ type: 'error', text: 'Selected date is unavailable for this vendor. Please choose another date.' })
      return
    }

    try {
      setBookingLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        setBookingMessage({ type: 'error', text: 'Please login to book a service' })
        setBookingLoading(false)
        return
      }

      await api.post(
        '/service-bookings',
        {
          service_id: selectedVendor.id,
          booking_date: bookingDate,
          notes: bookingNotes || '',
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setBookingMessage({ 
        type: 'success', 
        text: 'Service booked successfully! Check your dashboard for details.' 
      })
      
      setTimeout(() => {
        handleCloseBookingDialog()
        navigate('/organizer-dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error booking service:', error)
      const errorMessage = (error as any).response?.data?.message || 'Failed to book service. Please try again.'
      setBookingMessage({ type: 'error', text: errorMessage })
    } finally {
      setBookingLoading(false)
    }
  }

  const serviceTypes = ['Photography', 'Catering', 'Event Planning', 'Entertainment', 'Flowers & Decor', 'Venue']

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Hero Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
          color: 'white',
          py: 6,
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Find Your Perfect Vendor
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 300, opacity: 0.95 }}>
                Browse and book from our curated collection of service providers
              </Typography>
            </Box>
            <Button
              startIcon={<HomeIcon />}
              variant="contained"
              onClick={() => navigate('/')}
              sx={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                },
              }}
            >
              Home
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 6 }}>
        {/* Sticky Filter Section */}
        <Fade in={true} timeout={500}>
          <Paper
            sx={{
              p: 3,
              mb: 4,
              background: 'white',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderRadius: 2,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search vendors by name, service, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#ff8c00' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  '&:hover fieldset': { borderColor: '#ff8c00' },
                },
              }}
            />

            {/* Service Type Filter */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip
                icon={<FilterListIcon />}
                label="All Services"
                onClick={() => setSelectedServiceType('all')}
                variant={selectedServiceType === 'all' ? 'filled' : 'outlined'}
                sx={{
                  background: selectedServiceType === 'all' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' : 'transparent',
                  color: selectedServiceType === 'all' ? 'white' : '#ff8c00',
                  borderColor: '#ff8c00',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              />
              {serviceTypes.map((service) => (
                <Chip
                  key={service}
                  label={service}
                  onClick={() => setSelectedServiceType(service)}
                  variant={selectedServiceType === service ? 'filled' : 'outlined'}
                  sx={{
                    background: selectedServiceType === service ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' : 'transparent',
                    color: selectedServiceType === service ? 'white' : '#ff8c00',
                    borderColor: '#ff8c00',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>

            {/* View & Sort Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', alignSelf: 'center' }}>
                  View:
                </Typography>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_: React.MouseEvent<HTMLElement> | null, newMode: 'grid' | 'list' | null) => {
                    if (newMode) setViewMode(newMode)
                  }}
                  size="small"
                  sx={{
                    '& .MuiToggleButton-root': {
                      borderColor: '#ff8c00',
                      color: '#ff8c00',
                      '&.Mui-selected': {
                        background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ToggleButton value="grid" aria-label="grid view">
                    <GridViewIcon />
                  </ToggleButton>
                  <ToggleButton value="list" aria-label="list view">
                    <ViewListIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#666', alignSelf: 'center' }}>
                  Sort by:
                </Typography>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'name')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    background: 'white',
                  }}
                >
                  <option value="rating">Rating (High to Low)</option>
                  <option value="price">Price (Low to High)</option>
                  <option value="name">Name (A to Z)</option>
                </select>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Vendors Grid / List */}
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr' }, gap: 3 }}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton width="80%" height={24} sx={{ mb: 1 }} />
                  <Skeleton width="60%" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" width="100%" height={32} sx={{ mb: 2 }} />
                  <Skeleton width="100%" height={36} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : filteredVendors.length === 0 ? (
          <Paper
            sx={{
              textAlign: 'center',
              py: 10,
              background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.05) 0%, rgba(255, 140, 0, 0) 100%)',
              border: '2px dashed rgba(255, 140, 0, 0.2)',
              borderRadius: 2,
            }}
          >
            <SearchIcon sx={{ fontSize: 64, color: 'rgba(255, 140, 0, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#666', mb: 1, fontWeight: 600 }}>
              No vendors found
            </Typography>
            <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
              Try adjusting your search or filters
            </Typography>
            <Button
              variant="outlined"
              onClick={() => {
                setSearchQuery('')
                setSelectedServiceType('all')
              }}
              sx={{ borderColor: '#ff8c00', color: '#ff8c00' }}
            >
              Clear Filters
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: viewMode === 'grid' ? 'repeat(3, 1fr)' : '1fr' }, gap: 3 }}>
            {getSortedVendors(filteredVendors).map((vendor, index) => (
              <Fade key={vendor.id} in={true} timeout={500 + index * 50}>
                <Card
                  onClick={() => handleViewDetails(vendor)}
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    borderRadius: 2,
                    overflow: 'hidden',
                    position: 'relative',
                    background: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    display: viewMode === 'list' ? 'flex' : 'block',
                    '&:hover': {
                      transform: viewMode === 'grid' ? 'translateY(-12px)' : 'translateX(8px)',
                      boxShadow: '0 16px 40px rgba(255, 140, 0, 0.25)',
                    },
                  }}
                >
                  {/* Image with Badge */}
                  <Box sx={{ position: 'relative', overflow: 'hidden', flexShrink: 0, width: viewMode === 'list' ? '200px' : '100%' }}>
                    <CardMedia
                      component="img"
                      height={viewMode === 'grid' ? 200 : 'auto'}
                      width={viewMode === 'list' ? 200 : 'auto'}
                      image={vendor.image}
                      alt={vendor.name}
                      sx={{ objectFit: 'cover', height: '100%' }}
                    />
                    {vendor.rating && vendor.rating >= 4.5 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)',
                          color: 'white',
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.875rem',
                          fontWeight: 700,
                        }}
                      >
                        <StarIcon sx={{ fontSize: 18 }} />
                        Top Rated
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {vendor.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#999', mb: 1.5, fontWeight: 500 }}>
                      {vendor.business}
                    </Typography>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Rating value={vendor.rating} readOnly size="small" />
                      <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                        {vendor.rating} ({vendor.totalRatings} reviews)
                      </Typography>
                    </Box>

                    {/* Service Type & Price */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        label={vendor.serviceType}
                        size="small"
                        sx={{
                          background: 'rgba(255, 140, 0, 0.1)',
                          color: '#ff8c00',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={vendor.price}
                        size="small"
                        sx={{
                          background: 'rgba(76, 175, 80, 0.1)',
                          color: '#4caf50',
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {viewMode === 'list' && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.6 }}>
                          <strong>Location:</strong> {vendor.location ?? 'Not specified'}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, pt: 1 }}>
                      {viewMode === 'grid' && (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#ff8c00',
                            color: '#ff8c00',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#ff6b35',
                              background: 'rgba(255, 140, 0, 0.05)',
                            },
                          }}
                        >
                          View Details
                        </Button>
                      )}
                      {viewMode === 'list' && (
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)', textTransform: 'none', fontWeight: 600 }}
                        >
                          View & Book
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            ))}
          </Box>
        )}

        {/* Vendor Details Dialog */}
        {selectedVendor && (
          <Dialog open={openDetailDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)', color: 'white' }}>
              {selectedVendor.name}
              {selectedVendor.verified && (
                <CheckCircleIcon sx={{ fontSize: 20, ml: 1, verticalAlign: 'middle' }} />
              )}
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Service Image */}
                {selectedVendor.image && (
                  <Box
                    component="img"
                    src={selectedVendor.image}
                    alt={selectedVendor.name}
                    sx={{
                      width: '100%',
                      height: 250,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                )}

                {/* Rating */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Rating value={selectedVendor.rating} readOnly />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.rating} ({selectedVendor.totalRatings} reviews)
                    </Typography>
                  </Box>
                </Box>

                {/* Business Info */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    Service Type
                  </Typography>
                  <Chip label={selectedVendor.serviceType} sx={{ background: 'rgba(255, 140, 0, 0.1)', color: '#ff8c00' }} />
                </Box>

                {/* Price */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    Price Range
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#ff8c00', fontWeight: 600 }}>
                    {selectedVendor.price}
                  </Typography>
                </Box>

                {/* About */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    About
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {selectedVendor.about}
                  </Typography>
                </Box>

                {/* Services */}
                {selectedVendor.services && selectedVendor.services.length > 0 && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 1 }}>
                      Services Offered
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedVendor.services.map((service) => (
                        <Chip
                          key={service}
                          label={service}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#ff8c00', color: '#ff8c00' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Contact Info */}
                <Box sx={{ background: 'rgba(255, 140, 0, 0.05)', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 1 }}>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: '#ff8c00' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.contact?.phone ?? 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#ff8c00' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.contact?.email ?? 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: '#ff8c00' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.location ?? 'Not specified'}
                    </Typography>
                  </Box>
                </Box>

                {/* Availability */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    Availability
                  </Typography>
                  <Chip
                    label={selectedVendor.availability}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      color: '#4caf50',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button onClick={handleCloseDialog} sx={{ color: '#666' }}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleBookClick}
                sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' }}
              >
                Book Now
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Booking Dialog */}
        <Dialog open={openBookingDialog} onClose={handleCloseBookingDialog} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)', color: 'white' }}>
            Book Service
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {bookingMessage.text && (
              <Alert severity={bookingMessage.type as 'success' | 'error'} sx={{ mb: 2 }}>
                {bookingMessage.text}
              </Alert>
            )}
            {selectedVendor && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#999', fontWeight: 500 }}>
                  Service
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedVendor.name}
                </Typography>
              </Box>
            )}
            {availabilityLoading ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Syncing vendor availability calendar...
              </Alert>
            ) : blockedDates.length > 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This vendor has {blockedDates.length} blocked date{blockedDates.length > 1 ? 's' : ''} in the next few months.
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                No blocked dates found in vendor calendar.
              </Alert>
            )}
            <TextField
              fullWidth
              label="Booking Date"
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              error={Boolean(bookingDate && blockedDates.includes(bookingDate))}
              helperText={bookingDate && blockedDates.includes(bookingDate) ? 'Unavailable date, please choose another one.' : undefined}
            />
            <TextField
              fullWidth
              label="Notes (Optional)"
              multiline
              rows={4}
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Add any special requests or notes..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button 
              onClick={handleCloseBookingDialog}
              disabled={bookingLoading}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleBookService}
              disabled={bookingLoading || availabilityLoading || (bookingDate ? blockedDates.includes(bookingDate) : false)}
              sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' }}
            >
              {bookingLoading ? <CircularProgress size={24} /> : 'Book Service'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  )
}

export default BrowseVendors
