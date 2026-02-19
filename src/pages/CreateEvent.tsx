import React, { useState } from 'react'
import { Box, Container, TextField, Button, Typography, CircularProgress, Card, CardMedia, Alert, Stack } from '@mui/material'
import api from '../api'
import { useNavigate } from 'react-router-dom'

const CreateEvent: React.FC = () => {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#0E3B26' }}>Create Event</Typography>
        
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
            value={location} 
            onChange={e => setLocation(e.target.value)} 
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#0E3B26' }}>Event Image (Optional)</Typography>
            <Box
              sx={{
                border: '2px dashed #0E3B26',
                borderRadius: '12px',
                padding: 2,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: 'rgba(14, 59, 38, 0.02)',
                '&:hover': {
                  backgroundColor: 'rgba(14, 59, 38, 0.06)',
                  borderColor: '#1B5E3C',
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
                  <Typography variant="caption" sx={{ color: '#0E3B26', fontWeight: 600 }}>
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
                background: 'linear-gradient(135deg, #0E3B26 0%, #1B5E3C 100%)',
                fontWeight: 700,
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
