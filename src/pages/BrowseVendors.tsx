/*
  File: src/pages/BrowseVendors.tsx
  Purpose: Modern vendor discovery page with advanced filtering, sorting, and view modes.

  Features:
  - Hero header with solid background
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
  Stack,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
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
import { API_CONFIG } from '../config/api.config'
import { getCategoryBanner } from '../data/categoryBanners'

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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
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
  const [guestName, setGuestName] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' })
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'name'>('rating')
  const [userRatings, setUserRatings] = useState<Record<number, number>>({})
  const [ratingNotice, setRatingNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true)
        const response = await api.get('/approved-services')
        const servicesData = Array.isArray(response.data) ? response.data : [response.data]
        
        const apiHost = API_CONFIG.getApiHost()
        const vendorsData = servicesData.map((service: any) => {
          const imageUrl = service.image ? (service.image.startsWith('/uploads/') ? `${apiHost}${service.image}` : service.image) : `https://i.pravatar.cc/150?img=${service.vendor_id}`;
          return {
            ...service,
            business: service.vendor_name,
            serviceType: service.category,
            rating: Number(service.vendor_rating || service.rating || 0),
            totalRatings: Number(service.vendor_total_ratings || service.totalRatings || 0),
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
        setUserRatings((prev) => {
          if (Object.keys(prev).length > 0) return prev
          return {}
        })
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

  const handleRatingChange = async (vendor: Vendor, newValue: number | null) => {
    if (newValue == null) return
    const providerId = vendor.vendor_id ?? vendor.user_id
    if (!providerId) {
      setRatingNotice({ type: 'error', text: 'Unable to rate this provider right now.' })
      return
    }

    const previousRating = userRatings[vendor.id]
    setUserRatings((prev) => ({ ...prev, [vendor.id]: newValue }))

    const token = localStorage.getItem('token')
    if (!token) {
      setRatingNotice({ type: 'error', text: 'Please sign in to rate providers.' })
      setUserRatings((prev) => {
        const next = { ...prev }
        if (previousRating == null) delete next[vendor.id]
        else next[vendor.id] = previousRating
        return next
      })
      navigate('/signin')
      return
    }

    try {
      const bookingsResp = await api.get('/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const reviewsResp = await api.get('/reviews/by-reviewer', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const existingReviews = Array.isArray(reviewsResp.data) ? reviewsResp.data : []
      const reviewedIds = new Set(existingReviews.map((r: any) => Number(r.booking_id)))
      const providerReview = existingReviews.find((r: any) => Number(r.provider_id) === Number(providerId))
      const completed = (bookingsResp.data || []).filter((b: any) => b.status === 'completed')
      const matching = completed.find(
        (b: any) => Number(b.vendor_id) === Number(providerId) && !reviewedIds.has(Number(b.id))
      )

      if (!matching && !providerReview) {
        setRatingNotice({ type: 'info', text: 'You can only rate after completing a booking with this provider.' })
        setUserRatings((prev) => {
          const next = { ...prev }
          if (previousRating == null) delete next[vendor.id]
          else next[vendor.id] = previousRating
          return next
        })
        return
      }

      const reviewResp = providerReview
        ? await api.put(
            `/reviews/${providerReview.id}`,
            { rating: newValue, comment: providerReview.comment || '' },
            { headers: { Authorization: `Bearer ${token}` } },
          )
        : await api.post(
            '/reviews',
            { booking_id: matching.id, rating: newValue, comment: '' },
            { headers: { Authorization: `Bearer ${token}` } },
          )

      const updatedRating = Number(reviewResp.data?.provider?.rating ?? vendor.rating ?? 0)
      const updatedTotal = Number(reviewResp.data?.provider?.totalRatings ?? vendor.totalRatings ?? 0)

      setVendors((prev) =>
        prev.map((v) => {
          const vProviderId = v.vendor_id ?? v.user_id
          if (vProviderId && Number(vProviderId) === Number(providerId)) {
            return {
              ...v,
              rating: updatedRating,
              totalRatings: updatedTotal,
            }
          }
          return v
        })
      )
      setRatingNotice({ type: 'success', text: providerReview ? 'Your rating was updated.' : 'Thanks! Your rating was submitted.' })
    } catch (error: any) {
      const status = error?.response?.status
      if (status === 409) {
        setRatingNotice({ type: 'info', text: 'You already reviewed this booking.' })
      } else {
        setRatingNotice({ type: 'error', text: error?.response?.data?.message || 'Failed to submit rating.' })
      }
      setUserRatings((prev) => {
        const next = { ...prev }
        if (previousRating == null) delete next[vendor.id]
        else next[vendor.id] = previousRating
        return next
      })
    }
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
    setGuestName('')
    setGuestPhone('')
    setVerificationCode('')
    setCodeSent(false)
    setBookingMessage({ type: '', text: '' })
    setBlockedDates([])
  }

  const handleSendVerificationCode = async () => {
    if (!selectedVendor) return
    if (!guestPhone.trim()) {
      setBookingMessage({ type: 'error', text: 'Please enter your phone number to receive a code.' })
      return
    }
    try {
      setSendingCode(true)
      setBookingMessage({ type: '', text: '' })
      const response = await api.post('/service-bookings/send-code', {
        service_id: selectedVendor.id,
        phone: guestPhone,
        name: guestName,
      })
      setCodeSent(true)
      const debugCode = response.data?.debugCode
      setBookingMessage({
        type: 'success',
        text: debugCode
          ? `Verification code generated for local development: ${debugCode}`
          : 'Verification code sent. Check your SMS messages.',
      })
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send verification code'
      setBookingMessage({ type: 'error', text: errorMessage })
    } finally {
      setSendingCode(false)
    }
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
        if (!guestName.trim() || !guestPhone.trim()) {
          setBookingMessage({ type: 'error', text: 'Please enter your name and phone number to book.' })
          setBookingLoading(false)
          return
        }
        if (!verificationCode.trim()) {
          setBookingMessage({ type: 'error', text: 'Please enter the verification code.' })
          setBookingLoading(false)
          return
        }
      }

      await api.post(
        '/service-bookings',
        {
          service_id: selectedVendor.id,
          booking_date: bookingDate,
          notes: bookingNotes || '',
          name: token ? undefined : guestName,
          email: token ? undefined : undefined,
          phone: token ? undefined : guestPhone,
          verification_code: token ? undefined : verificationCode,
        },
        token
          ? {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          : undefined
      )

      setBookingMessage({ 
        type: 'success', 
        text: token
          ? 'Service booked successfully! Check your dashboard for details.'
          : 'Booking request sent! We will contact you with updates.' 
      })
      
      setTimeout(() => {
        handleCloseBookingDialog()
        if (token) navigate('/organizer-dashboard')
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

  const hasAuth = Boolean(localStorage.getItem('token'))
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Hero Header */}
      <Box
        sx={{
          backgroundColor: '#F19B7D',
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'flex-start' }, gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '2rem', md: '3rem' } }}>
                Find Your Perfect Vendor
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 300, opacity: 0.95, fontSize: { xs: '1rem', md: '1.25rem' } }}>
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
                width: { xs: '100%', md: 'auto' },
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

      <Container maxWidth="lg" sx={{ pb: 6, px: { xs: 2, sm: 3 } }}>
        {ratingNotice && (
          <Alert severity={ratingNotice.type} sx={{ mb: 2 }} onClose={() => setRatingNotice(null)}>
            {ratingNotice.text}
          </Alert>
        )}
        {/* Sticky Filter Section */}
        <Fade in={true} timeout={500}>
          <Paper
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 4,
              backgroundColor: 'background.paper',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderRadius: 2,
              position: 'sticky',
              top: { xs: 76, md: 0 },
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
                    <SearchIcon sx={{ color: '#F19B7D' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: { xs: 2.5, sm: 3 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  '&:hover fieldset': { borderColor: '#F19B7D' },
                },
              }}
            />

            {/* Service Type Filter */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexWrap: { xs: 'nowrap', sm: 'wrap' },
                overflowX: { xs: 'auto', sm: 'visible' },
                pb: { xs: 1, sm: 0 },
                mb: { xs: 2.5, sm: 3 },
                '&::-webkit-scrollbar': { height: 6 },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(241, 155, 125, 0.4)',
                  borderRadius: 999,
                },
              }}
            >
              <Chip
                icon={<FilterListIcon />}
                label="All Services"
                onClick={() => setSelectedServiceType('all')}
                variant={selectedServiceType === 'all' ? 'filled' : 'outlined'}
                sx={{
                  background: selectedServiceType === 'all' ? '#F19B7D' : 'transparent',
                  color: selectedServiceType === 'all' ? 'white' : '#F19B7D',
                  borderColor: '#F19B7D',
                  cursor: 'pointer',
                  fontWeight: 600,
                  flex: '0 0 auto',
                }}
              />
              {serviceTypes.map((service) => (
                <Chip
                  key={service}
                  label={service}
                  onClick={() => setSelectedServiceType(service)}
                  variant={selectedServiceType === service ? 'filled' : 'outlined'}
                  sx={{
                    background: selectedServiceType === service ? '#F19B7D' : 'transparent',
                    color: selectedServiceType === service ? 'white' : '#F19B7D',
                    borderColor: '#F19B7D',
                    cursor: 'pointer',
                    fontWeight: 500,
                    flex: '0 0 auto',
                  }}
                />
              ))}
            </Box>

            {/* View & Sort Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
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
                      borderColor: '#F19B7D',
                      color: '#F19B7D',
                      '&.Mui-selected': {
                        background: '#F19B7D',
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

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
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
                    backgroundColor: theme.palette.background.paper,
                    width: isMobile ? '100%' : undefined,
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

        {/* Category Banner */}
        {selectedServiceType !== 'all' && getCategoryBanner(selectedServiceType) && (
          <Fade in={true} timeout={500}>
            <Paper
              sx={{
                mb: 4,
                borderRadius: 3,
                overflow: 'hidden',
                height: { xs: 180, sm: 240, md: 280 },
                position: 'relative',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                backgroundColor: '#f0f0f0',
              }}
            >
              {/* Banner Image */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${getCategoryBanner(selectedServiceType)?.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />

              {/* Banner Content */}
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: { xs: 2, sm: 3, md: 4 },
                  color: 'white',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mb: 1,
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {getCategoryBanner(selectedServiceType)?.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 400,
                    opacity: 0.9,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.05rem' },
                    maxWidth: '85%',
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                    lineHeight: 1.5,
                  }}
                >
                  {getCategoryBanner(selectedServiceType)?.description}
                </Typography>
              </Box>
            </Paper>
          </Fade>
        )}

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
                backgroundColor: 'rgba(241, 155, 125, 0.08)',
                border: '2px dashed rgba(241, 155, 125, 0.24)',
                borderRadius: 2,
              }}
          >
            <SearchIcon sx={{ fontSize: 64, color: 'rgba(241, 155, 125, 0.34)', mb: 2 }} />
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
              sx={{ borderColor: '#F19B7D', color: '#F19B7D' }}
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
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: theme.palette.background.paper,
                    border: '1px solid rgba(20, 33, 61, 0.08)',
                    boxShadow: '0 6px 18px rgba(20, 33, 61, 0.08)',
                    display: viewMode === 'list' ? { xs: 'block', sm: 'flex' } : 'block',
                    '&:hover': {
                      transform: viewMode === 'grid' ? 'translateY(-6px)' : 'translateX(6px)',
                      boxShadow: '0 16px 32px rgba(20, 33, 61, 0.14)',
                    },
                  }}
                >
                  {/* Image with Badge */}
                  <Box
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                      width: viewMode === 'list' ? { xs: '100%', sm: '220px' } : '100%',
                      height: viewMode === 'list' ? { xs: 220, sm: 220 } : 220,
                      backgroundColor: 'action.hover',
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="220"
                      width="220"
                      image={vendor.image}
                      alt={vendor.name}
                      sx={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
                    />
                    {vendor.rating && vendor.rating >= 4.5 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: '#F19B7D',
                          color: 'white',
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          boxShadow: '0 6px 14px rgba(20, 33, 61, 0.2)',
                        }}
                      >
                        <StarIcon sx={{ fontSize: 18 }} />
                        Top Rated
                      </Box>
                    )}
                  </Box>

                  <CardContent sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.3, fontSize: '1.05rem' }} noWrap>
                          {vendor.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#8A9099', fontWeight: 500 }} noWrap>
                          {vendor.business}
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, color: '#2f6f3e', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                        {vendor.price}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <Rating
                          value={userRatings[vendor.id] ?? vendor.rating ?? 0}
                          onChange={(_e, value) => handleRatingChange(vendor, value)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#5F6670', fontWeight: 500 }}>
                        {vendor.rating ?? 0} ({vendor.totalRatings} reviews)
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={vendor.serviceType}
                        size="small"
                        sx={{
                          background: 'rgba(241, 155, 125, 0.14)',
                          color: '#F19B7D',
                          fontWeight: 600,
                        }}
                      />
                      {viewMode === 'list' && (
                        <Chip
                          label={vendor.location ?? 'Not specified'}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: '#E4E7EB', color: '#5F6670' }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, pt: 0.6 }}>
                      {viewMode === 'grid' && (
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: '#F19B7D',
                            color: '#F19B7D',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                              borderColor: '#DD8568',
                              background: 'rgba(241, 155, 125, 0.08)',
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
                          sx={{ backgroundColor: '#F19B7D', textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: '#DD8568' } }}
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
            <DialogTitle sx={{ backgroundColor: '#F19B7D', color: 'white' }}>
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
                  <Chip label={selectedVendor.serviceType} sx={{ background: 'rgba(241, 155, 125, 0.14)', color: '#F19B7D' }} />
                </Box>

                {/* Price */}
                <Box>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 0.5 }}>
                    Price Range
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#F19B7D', fontWeight: 600 }}>
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
                          sx={{ borderColor: '#F19B7D', color: '#F19B7D' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Contact Info */}
                <Box sx={{ background: 'rgba(241, 155, 125, 0.08)', p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: '#999', fontWeight: 500, mb: 1 }}>
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: '#F19B7D' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.contact?.phone ?? 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#F19B7D' }} />
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {selectedVendor.contact?.email ?? 'Not provided'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOnIcon sx={{ fontSize: 16, color: '#F19B7D' }} />
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
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
                sx={{ backgroundColor: '#F19B7D', '&:hover': { backgroundColor: '#DD8568' } }}
              >
                Book Now
              </Button>
            </DialogActions>
          </Dialog>
        )}

        {/* Booking Dialog */}
        <Dialog open={openBookingDialog} onClose={handleCloseBookingDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ backgroundColor: '#F19B7D', color: 'white' }}>
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
            {!hasAuth && (
              <Box sx={{ mt: 2, display: 'grid', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  helperText="We'll send your verification code by SMS."
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSendVerificationCode}
                    disabled={sendingCode}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {sendingCode ? 'Sending...' : codeSent ? 'Resend Code' : 'Send Code'}
                  </Button>
                </Stack>
              </Box>
            )}
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
              sx={{ backgroundColor: '#F19B7D', '&:hover': { backgroundColor: '#DD8568' } }}
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


