import React, { useState } from 'react'
import { Box, Container, TextField, Button, Typography, CircularProgress } from '@mui/material'
import api from '../api'
import { useNavigate } from 'react-router-dom'

const CreateEvent: React.FC = () => {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Create Event</Typography>
        <TextField label="Event Name" fullWidth value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Date" type="datetime-local" fullWidth value={date} onChange={e => setDate(e.target.value)} sx={{ mb: 2 }} InputLabelProps={{ shrink: true }} />
        <TextField label="Type" fullWidth value={type} onChange={e => setType(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Location" fullWidth value={location} onChange={e => setLocation(e.target.value)} sx={{ mb: 2 }} />
        <TextField label="Description" fullWidth multiline minRows={3} value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />
        <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} style={{ marginBottom: 12 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? <CircularProgress size={20} /> : 'Create Event'}</Button>
        </Box>
      </Container>
    </Box>
  )
}

export default CreateEvent
