import React, { useEffect, useRef, useState } from 'react'
import { Box, Container, TextField, Button, Typography, CircularProgress, Card, CardMedia, Alert, Stack } from '@mui/material'
import api from '../api'
import { useNavigate } from 'react-router-dom'

const CreateEvent: React.FC = () => {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [budget, setBudget] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const locationInputRef = useRef<HTMLInputElement | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
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
          setLocation(formatted)
          setLatitude(lat ? String(lat) : '')
          setLongitude(lng ? String(lng) : '')
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
  }, [])

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

  const handleSubmit = async () => {
    if (!name || !date) return alert('Name and date required')
    try {
      setLoading(true)
      const form = new FormData()
      form.append('name', name)
      form.append('date', date)
      form.append('type', type)
      form.append('description', description)
      form.append('location', location)
      form.append('latitude', latitude)
      form.append('longitude', longitude)
      if (guestCount) form.append('guest_count', guestCount)
      if (budget) form.append('budget', budget)
      if (imageFile) form.append('image', imageFile)

      const resp = await api.post('/events', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      alert('Event created')
      navigate(`/events/${resp.data.id}`)
    } catch (err: any) {
      console.error('Create event failed', err)
      alert(err?.response?.data?.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#414958' }}>Create Event</Typography>
        
        <Stack spacing={2}>
          <TextField 
            label="Event Name" 
            fullWidth 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required
          />
          
          <TextField 
            label="Date" 
            type="datetime-local" 
            fullWidth 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            required
            InputLabelProps={{ shrink: true }} 
          />
          
          <TextField 
            label="Type" 
            fullWidth 
            value={type} 
            onChange={e => setType(e.target.value)} 
          />
          
          <TextField 
            label="Location" 
            fullWidth 
            inputRef={locationInputRef}
            value={location} 
            onChange={e => {
              setLocation(e.target.value)
              setLatitude('')
              setLongitude('')
            }} 
            placeholder="Search for address or venue"
          />
          
          <TextField 
            label="Expected Number of Registrants" 
            type="number" 
            fullWidth 
            value={guestCount}
            onChange={e => setGuestCount(e.target.value)}
            inputProps={{ min: '0', step: '1' }}
          />
          
          <TextField 
            label="Budget (GHS)" 
            type="number" 
            fullWidth 
            value={budget}
            onChange={e => setBudget(e.target.value)}
            inputProps={{ min: '0', step: '0.01' }}
          />
          
          <TextField 
            label="Description" 
            fullWidth 
            multiline 
            minRows={3} 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />

          {/* Image Upload Section */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#414958' }}>Event Image (Optional)</Typography>
            <Box
              sx={{
                border: '2px dashed #414958',
                borderRadius: '12px',
                padding: 2,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(65, 73, 88, 0.03)',
                '&:hover': {
                  backgroundColor: 'rgba(65, 73, 88, 0.08)',
                  borderColor: '#2B3240',
                },
              }}
              component="label"
            >
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <Stack spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Click to select image (JPG, PNG, GIF, WebP - Max 5MB)
                </Typography>
              </Stack>
            </Box>

            {imageError && <Alert severity="error" sx={{ mt: 1 }}>{imageError}</Alert>}

            {/* Image Preview */}
            {imagePreview && (
              <Card sx={{ mt: 2, position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={imagePreview}
                  alt="Preview"
                  sx={{ maxHeight: 300, objectFit: 'cover' }}
                />
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#414958', fontWeight: 600 }}>
                    {imageFile?.name} ({((imageFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                  </Typography>
                  <Button 
                    size="small" 
                    onClick={clearImage}
                    sx={{ display: 'block', mt: 1, color: '#D32F2F' }}
                  >
                    Remove Image
                  </Button>
                </Box>
              </Card>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit} 
              disabled={loading || !name || !date}
              sx={{
                backgroundColor: '#414958',
                fontWeight: 700,
                '&:hover': { backgroundColor: '#2B3240' },
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Create Event'}
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}

export default CreateEvent

