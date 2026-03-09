/*
  File: src/pages/VendorProfile.tsx
  Purpose: Provider profile view and edit page; manages business info and portfolio.

  Major responsibilities:
  - Fetch the authenticated vendor profile (`GET /api/vendor/profile`)
  - Upload/preview profile and portfolio images (POST `/api/vendor/upload-image`)
  - Display reviews and provider metadata used across Browse and Vendor pages

  Where it affects the UI / routes:
  - Route: `/vendor-profile`
  - Affects provider-facing profile editor and public provider detail pages

  Important notes:
  - `/api/vendor/profile` is intended to be accessed by authenticated providers;
    tests assume authenticated access — update server if behavior should be public.
*/
import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Button,
  Typography,
  Card,
  CardContent,
  Paper,
  TextField,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Rating,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import HomeIcon from '@mui/icons-material/Home'
import api from '../api'

interface VendorProfile {
  id?: number
  userId?: number
  businessName: string
  serviceType: string
  description: string
  hourlyRate: number
  profileImage?: string
  portfolioImages?: string[]
  phone?: string
  email?: string
  location?: string
  availability?: string
}

interface Review {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

const VendorProfile: React.FC = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<VendorProfile>({
    businessName: '',
    serviceType: 'Photography',
    description: '',
    hourlyRate: 100,
    portfolioImages: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [profileImagePreview, setProfileImagePreview] = useState<string>('')
  const [portfolioImagePreviews, setPortfolioImagePreviews] = useState<string[]>([])
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviews.length
    : 0

  const serviceTypes = [
    'Photography',
    'Catering',
    'Event Planning',
    'Entertainment',
    'Flowers & Decor',
    'Venue',
  ]

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile && profile.userId) {
      fetchReviews(profile.userId)
    }
  }, [profile.userId])

  const fetchReviews = async (providerId: number) => {
    try {
      const response = await api.get(`/reviews/${providerId}`)
      setReviews(response.data)
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/vendor/profile')
      setProfile(response.data)
      if (response.data.profileImage) {
        setProfileImagePreview(response.data.profileImage)
      }
      if (response.data.portfolioImages) {
        setPortfolioImagePreviews(response.data.portfolioImages)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      // Initialize empty profile if not found
      setProfile({
        businessName: '',
        serviceType: 'Photography',
        description: '',
        hourlyRate: 100,
        portfolioImages: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfile({
      ...profile,
      [name]: name === 'hourlyRate' ? parseFloat(value) : value,
    })
  }

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError('')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')

      console.log('Uploading profile image:', file.name)
      
      const response = await api.post('/vendor/upload-image', formData)

      console.log('Profile image uploaded:', response.data)
      const updatedProfile = { ...profile, profileImage: response.data.imageUrl }
      setProfileImagePreview(response.data.imageUrl)
      setProfile(updatedProfile)
      
      // Auto-save profile with new image
      await saveProfileWithImage(updatedProfile)
      setSuccess('Profile image uploaded and saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Profile image upload error:', error.response?.data || error.message)
      setError(error.response?.data?.message || 'Failed to upload profile image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveProfileWithImage = async (profileToSave: VendorProfile) => {
    try {
      await api.put('/vendor/profile', profileToSave)
    } catch (error: any) {
      console.error('Error saving profile:', error.message)
      throw error
    }
  }

  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingIndex(portfolioImagePreviews.length)
      setError('')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'portfolio')

      console.log('Uploading portfolio image:', file.name)
      
      const response = await api.post('/vendor/upload-image', formData)

      console.log('Portfolio image uploaded:', response.data)
      const newPreviews = [...portfolioImagePreviews, response.data.imageUrl]
      setPortfolioImagePreviews(newPreviews)
      
      const updatedProfile = {
        ...profile,
        portfolioImages: newPreviews,
      }
      setProfile(updatedProfile)
      
      // Auto-save profile with new portfolio images
      await saveProfileWithImage(updatedProfile)
      setSuccess('Portfolio image added and saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      console.error('Portfolio image upload error:', error.response?.data || error.message)
      setError(error.response?.data?.message || 'Failed to upload portfolio image. Please try again.')
    } finally {
      setUploadingIndex(null)
    }
  }

  const removePortfolioImage = (index: number) => {
    const newPreviews = portfolioImagePreviews.filter((_, i) => i !== index)
    setPortfolioImagePreviews(newPreviews)
    setProfile({
      ...profile,
      portfolioImages: newPreviews,
    })
  }

  const handleSaveProfile = async () => {
    try {
      setLoading(true)
      await api.put('/vendor/profile', profile)
      setSuccess('Profile saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      setError('Failed to save profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile.businessName) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Vendor Profile
            </Typography>
            <Typography variant="body1" sx={{ color: '#999' }}>
              Manage your business profile and showcase your work
            </Typography>
          </Box>
          <Button
            startIcon={<HomeIcon />}
            variant="outlined"
            onClick={() => navigate('/provider-dashboard')}
            sx={{ borderColor: '#F19B7D', color: '#F19B7D' }}
          >
            Dashboard
          </Button>
        </Box>

        {/* Messages */}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Profile Image Section */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 4, mb: 4 }}>
          <Box>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Profile Picture
                </Typography>
                <Avatar
                  src={profileImagePreview}
                  sx={{
                    width: 200,
                    height: 200,
                    mb: 2,
                    background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                  }}
                />
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                  fullWidth
                >
                  Upload Profile Photo
                  <input type="file" hidden accept="image/*" onChange={handleProfileImageUpload} />
                </Button>
                <Typography variant="caption" sx={{ color: '#999', mt: 1, textAlign: 'center' }}>
                  Recommended: Square image, at least 400x400px
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Business Info Section */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Business Information
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                  <TextField
                    label="Business Name"
                    name="businessName"
                    value={profile.businessName}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Service Type"
                    name="serviceType"
                    select
                    SelectProps={{ native: true }}
                    value={profile.serviceType}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </TextField>
                </Box>

                <TextField
                  label="Hourly Rate ($)"
                  name="hourlyRate"
                  type="number"
                  value={profile.hourlyRate}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  sx={{ mb: 2 }}
                  inputProps={{ step: '0.01', min: '0' }}
                />

                <TextField
                  label="Business Description"
                  name="description"
                  value={profile.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  placeholder="Describe your services, experience, and what makes your business unique..."
                />
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Reviews Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Reviews
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Rating precision={0.1} value={Number(averageRating.toFixed(1))} readOnly />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {averageRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? '' : 's'})
              </Typography>
            </Box>
            {reviews.length === 0 ? (
              <Typography color="text.secondary">No reviews yet.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {reviews.map((review) => (
                  <Paper key={review.id} sx={{ p: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{review.reviewer_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Rating value={Number(review.rating || 0)} readOnly size="small" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{review.rating}/5</Typography>
                    </Box>
                    <Typography variant="body2">{review.comment || 'No comment provided.'}</Typography>
                  </Paper>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Portfolio / Work Examples
              </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<AddIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Add Image
                <input type="file" hidden accept="image/*" onChange={handlePortfolioImageUpload} />
              </Button>
            </Box>

            {portfolioImagePreviews.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(241, 155, 125, 0.08) 0%, rgba(241, 155, 125, 0) 100%)',
                  border: '2px dashed rgba(241, 155, 125, 0.24)',
                  borderRadius: 2,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 48, color: '#F19B7D', mb: 1, opacity: 0.5 }} />
                <Typography sx={{ color: '#999' }}>
                  No portfolio images yet. Add images to showcase your work!
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                {portfolioImagePreviews.map((image, index) => (
                  <Box key={index}>
                    <Card>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingBottom: '100%',
                          overflow: 'hidden',
                          '&:hover .delete-btn': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={image}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          className="delete-btn"
                          onClick={() => removePortfolioImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            opacity: 0,
                            transition: 'opacity 0.3s',
                            '&:hover': {
                              background: 'rgba(0,0,0,0.8)',
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {uploadingIndex === index && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0,0,0,0.7)',
                            }}
                          >
                            <CircularProgress sx={{ color: '#F19B7D' }} />
                          </Box>
                        )}
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}

            <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 2 }}>
              Tip: Upload high-quality images of your best work to attract more clients
            </Typography>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/provider-dashboard')}
            sx={{ borderColor: '#F19B7D', color: '#F19B7D' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveProfile}
            disabled={loading}
            sx={{
              background: 'linear-gradient(135deg, #F19B7D 0%, #DD8568 100%)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </Box>
      </Box>
    </Container>
  )
}

export default VendorProfile



