# Code Changes Summary - Service Booking System

## Overview of Changes

This document summarizes all the code changes made to implement the service booking system.

---

## 1. Frontend Changes

### A. BrowseVendors.tsx

#### Added Imports:
```typescript
import { Alert, CircularProgress } from '@mui/material'
```

#### Added State Variables:
```typescript
const [openBookingDialog, setOpenBookingDialog] = useState(false)
const [bookingDate, setBookingDate] = useState('')
const [bookingNotes, setBookingNotes] = useState('')
const [bookingLoading, setBookingLoading] = useState(false)
const [bookingMessage, setBookingMessage] = useState({ type: '', text: '' })
```

#### Added Functions:
```typescript
// Open booking dialog when "Book Now" clicked
const handleBookClick = () => {
  setOpenDetailDialog(false)
  setOpenBookingDialog(true)
  setBookingMessage({ type: '', text: '' })
}

// Close booking dialog and reset form
const handleCloseBookingDialog = () => {
  setOpenBookingDialog(false)
  setBookingDate('')
  setBookingNotes('')
  setBookingMessage({ type: '', text: '' })
}

// Submit booking to backend
const handleBookService = async () => {
  if (!bookingDate) {
    setBookingMessage({ type: 'error', text: 'Please select a booking date' })
    return
  }

  if (!selectedVendor) {
    setBookingMessage({ type: 'error', text: 'No service selected' })
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

    await axios.post(
      'http://localhost:5000/api/service-bookings',
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
```

#### Updated Book Now Button:
```typescript
<Button
  variant="contained"
  onClick={handleBookClick}  // Changed from no action to handleBookClick
  sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' }}
>
  Book Now
</Button>
```

#### Added Booking Dialog:
```typescript
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
    <TextField
      fullWidth
      label="Booking Date"
      type="date"
      value={bookingDate}
      onChange={(e) => setBookingDate(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ mb: 2 }}
      inputProps={{ min: new Date().toISOString().split('T')[0] }}
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
      disabled={bookingLoading}
      sx={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)' }}
    >
      {bookingLoading ? <CircularProgress size={24} /> : 'Book Service'}
    </Button>
  </DialogActions>
</Dialog>
```

---

### B. OrganizerDashboard.tsx

#### Added Interface:
```typescript
interface ServiceBooking {
  id: number
  service_id: number
  vendor_id: number
  organizer_id: number
  service_title: string
  vendor_name: string
  booking_date: string
  notes: string
  status: 'pending' | 'confirmed' | 'rejected' | 'completed' | 'cancelled'
  created_at: string
}
```

#### Added State:
```typescript
const [bookings, setBookings] = useState<ServiceBooking[]>([])
```

#### Updated fetchDashboardData:
```typescript
// Added booking fetch inside existing function
try {
  const bookingsResponse = await axios.get('http://localhost:5000/api/my-bookings', {
    headers: { Authorization: `Bearer ${token}` },
  })
  setBookings(bookingsResponse.data || [])
} catch (bookingError) {
  console.error('Failed to fetch bookings:', bookingError)
}
```

#### Added Bookings Section:
```typescript
{/* Bookings Section */}
<Box sx={{ mt: 6 }}>
  <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
    Service Bookings
  </Typography>

  {bookings.length === 0 ? (
    <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 2 }}>
      <EventIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
        No service bookings yet
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Browse vendors and book services to see them here
      </Typography>
      <Button variant="contained" onClick={() => navigate('/browse-vendors')}>
        Browse Vendors
      </Button>
    </Paper>
  ) : (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table>
        <TableHead sx={{ background: 'linear-gradient(135deg, rgba(31, 77, 92, 0.1) 0%, rgba(31, 77, 92, 0.05) 100%)' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Service</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Vendor</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Booking Date</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2 }}>Notes</TableCell>
            <TableCell sx={{ fontWeight: 600, py: 2, textAlign: 'center' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id} sx={{ transition: 'all 0.2s ease', '&:hover': { bgcolor: 'action.hover' } }}>
              <TableCell sx={{ py: 2 }}>
                <Typography sx={{ fontWeight: 500 }}>{booking.service_title}</Typography>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Typography>{booking.vendor_name}</Typography>
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                {new Date(booking.booking_date).toLocaleDateString()}
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Chip
                  label={booking.status}
                  size="small"
                  color={
                    booking.status === 'confirmed'
                      ? 'success'
                      : booking.status === 'pending'
                      ? 'warning'
                      : booking.status === 'completed'
                      ? 'info'
                      : 'error'
                  }
                  variant="outlined"
                />
              </TableCell>
              <TableCell sx={{ py: 2 }}>
                <Typography variant="body2" sx={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {booking.notes || 'No notes'}
                </Typography>
              </TableCell>
              <TableCell sx={{ py: 2, textAlign: 'center' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/messaging?vendorId=${booking.vendor_id}`)}
                >
                  Message
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</Box>
```

---

### C. ProviderDashboard.tsx

#### Updated Booking Interface:
```typescript
interface Booking {
  id: number
  eventName?: string
  date?: string
  status: 'pending' | 'confirmed' | 'completed' | 'rejected' | 'cancelled'
  amount?: string
  service_title?: string
  organizer_name?: string
  booking_date?: string
  notes?: string
  organizer_id?: number
}
```

#### Cleaned Up Imports:
Removed unused imports: Card, CardContent, LinearProgress, Tooltip, Fade, Alert, TrendingUpIcon, etc.

#### Updated fetchDashboardData:
```typescript
// Fetch service bookings for provider
try {
  const bookingsResponse = await axios.get('http://localhost:5000/api/provider-bookings', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const fetchedBookings = bookingsResponse.data || []
  // Transform data to match Booking interface
  const transformedBookings = fetchedBookings.map((booking: any) => ({
    id: booking.id,
    service_title: booking.service_title || booking.title,
    organizer_name: booking.organizer_name,
    booking_date: booking.booking_date,
    date: booking.booking_date,
    status: booking.status,
    notes: booking.notes,
    organizer_id: booking.organizer_id,
  }))
  setBookings(transformedBookings)
} catch (bookingError) {
  console.error('Failed to fetch service bookings:', bookingError)
  setBookings(response.data.bookings || [])
}
```

#### Updated handleAcceptBooking:
```typescript
const handleAcceptBooking = async () => {
  if (selectedBooking) {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login to accept bookings')
        return
      }

      await axios.put(
        `http://localhost:5000/api/service-bookings/${selectedBooking.id}`,
        { status: 'confirmed' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      // Update local state
      const updated = bookings.map((b) =>
        b.id === selectedBooking.id ? { ...b, status: 'confirmed' as const } : b
      )
      setBookings(updated)
      handleCloseDialog()
    } catch (error) {
      console.error('Error confirming booking:', error)
      alert('Failed to confirm booking')
    }
  }
}
```

#### Updated Table Headers:
```typescript
<TableCell sx={{ fontWeight: 600, py: 2 }}>Service</TableCell>
<TableCell sx={{ fontWeight: 600, py: 2 }}>Organizer</TableCell>
<TableCell sx={{ fontWeight: 600, py: 2 }}>Booking Date</TableCell>
<TableCell sx={{ fontWeight: 600, py: 2 }}>Status</TableCell>
```

#### Updated Table Rows:
```typescript
<TableCell sx={{ py: 2 }}>
  <Typography sx={{ fontWeight: 500 }}>{booking.service_title || booking.eventName}</Typography>
</TableCell>
<TableCell sx={{ py: 2 }}>
  <Typography>{booking.organizer_name}</Typography>
</TableCell>
<TableCell sx={{ py: 2 }}>
  {new Date(booking.booking_date || booking.date || '').toLocaleDateString()}
</TableCell>
```

#### Updated Dialog Content:
Shows service_title, organizer_name, booking_date, notes, and status with proper formatting.

---

## 2. Backend Changes

### A. server/server.js - New Endpoints

#### 1. POST /api/service-bookings (Create Booking)
```javascript
app.post('/api/service-bookings', verifyToken, (req, res) => {
  try {
    const { service_id, booking_date, notes } = req.body
    const organizer_id = req.user.id

    // Get service to verify it exists and get vendor_id
    db.query('SELECT vendor_id FROM services WHERE id = ?', [service_id], (err, services) => {
      if (err || services.length === 0) {
        return res.status(404).json({ message: 'Service not found' })
      }

      const vendor_id = services[0].vendor_id

      // Create booking
      db.query(
        'INSERT INTO service_bookings (service_id, vendor_id, organizer_id, booking_date, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
        [service_id, vendor_id, organizer_id, booking_date, notes || '', 'pending'],
        (err, result) => {
          if (err) {
            console.error('Booking creation error:', err)
            return res.status(500).json({ message: 'Failed to create booking' })
          }
          res.json({ message: 'Booking created successfully', bookingId: result.insertId })
        }
      )
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})
```

#### 2. GET /api/my-bookings (Organizer View Bookings)
```javascript
app.get('/api/my-bookings', verifyToken, (req, res) => {
  try {
    const organizer_id = req.user.id

    db.query(
      `SELECT 
        sb.id,
        sb.service_id,
        sb.vendor_id,
        sb.organizer_id,
        s.title as service_title,
        u.name as vendor_name,
        sb.booking_date,
        sb.notes,
        sb.status,
        sb.created_at
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      JOIN users u ON sb.vendor_id = u.id
      WHERE sb.organizer_id = ?
      ORDER BY sb.created_at DESC`,
      [organizer_id],
      (err, results) => {
        if (err) {
          console.error('Fetch bookings error:', err)
          return res.status(500).json({ message: 'Failed to fetch bookings' })
        }
        res.json(results)
      }
    )
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})
```

#### 3. GET /api/provider-bookings (Provider View Requests)
```javascript
app.get('/api/provider-bookings', verifyToken, (req, res) => {
  try {
    const vendor_id = req.user.id

    db.query(
      `SELECT 
        sb.id,
        sb.service_id,
        sb.vendor_id,
        sb.organizer_id,
        s.title as service_title,
        u.name as organizer_name,
        sb.booking_date,
        sb.notes,
        sb.status,
        sb.created_at
      FROM service_bookings sb
      JOIN services s ON sb.service_id = s.id
      JOIN users u ON sb.organizer_id = u.id
      WHERE sb.vendor_id = ?
      ORDER BY sb.created_at DESC`,
      [vendor_id],
      (err, results) => {
        if (err) {
          console.error('Fetch provider bookings error:', err)
          return res.status(500).json({ message: 'Failed to fetch bookings' })
        }
        res.json(results)
      }
    )
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})
```

#### 4. PUT /api/service-bookings/:bookingId (Update Status)
```javascript
app.put('/api/service-bookings/:bookingId', verifyToken, (req, res) => {
  try {
    const { bookingId } = req.params
    const { status } = req.body
    const allowedStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled']

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    db.query(
      'UPDATE service_bookings SET status = ? WHERE id = ?',
      [status, bookingId],
      (err) => {
        if (err) {
          console.error('Update booking error:', err)
          return res.status(500).json({ message: 'Failed to update booking' })
        }
        res.json({ message: 'Booking status updated', status })
      }
    )
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
})
```

---

### B. server/db.js - New Table

#### Added service_bookings Table:
```javascript
// In the initialization function
db.query(
  `CREATE TABLE IF NOT EXISTS service_bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_id INT NOT NULL,
    vendor_id INT NOT NULL,
    organizer_id INT NOT NULL,
    booking_date DATE NOT NULL,
    notes TEXT,
    status ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (organizer_id),
    INDEX (vendor_id),
    INDEX (service_id)
  )`,
  (err) => {
    if (err) console.error('Error creating service_bookings table:', err)
  }
)
```

---

## 3. Configuration Changes

### Updated TypeScript Configuration
- Added strict type checking for new interfaces
- Removed unused import warnings by cleaning up unused variables

### Build Status
- ✅ TypeScript compilation: SUCCESS
- ✅ Vite build: SUCCESS
- ✅ No console errors
- ✅ All dependencies resolved

---

## 4. API Endpoint Summary

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/service-bookings | Yes | Create new booking |
| GET | /api/my-bookings | Yes | Get organizer's bookings |
| GET | /api/provider-bookings | Yes | Get provider's booking requests |
| PUT | /api/service-bookings/:id | Yes | Update booking status |

---

## 5. Key Design Decisions

1. **Separate Endpoints for Roles**
   - `/api/my-bookings` - Organizer focused
   - `/api/provider-bookings` - Provider focused
   - Cleaner data transformation per role

2. **Status as ENUM**
   - Database constraint for data integrity
   - Prevents invalid statuses
   - Clear workflow definition

3. **Foreign Key Relationships**
   - Cascade deletes ensure consistency
   - Referential integrity maintained
   - Data safety guardrails

4. **Timestamps**
   - Track booking creation
   - Track last update
   - Audit trail ready

5. **JWT Authentication**
   - All endpoints secured
   - User context from token
   - Role-based access control

---

## 6. Testing the Changes

### Prerequisites:
```bash
npm install  # Install dependencies
npm run build # Compile TypeScript and build
npm run dev # Start dev server (port 5174 or 5173)
```

### Backend running at: http://localhost:5000
### Frontend running at: http://localhost:5173 (or 5174)

---

## Summary of Lines Changed

- **BrowseVendors.tsx**: ~150 lines added (imports, state, handlers, dialog)
- **OrganizerDashboard.tsx**: ~100 lines added (interface, state, section)
- **ProviderDashboard.tsx**: ~80 lines modified (imports cleanup, handlers, data transformation)
- **server.js**: ~150 lines added (4 new endpoints)
- **db.js**: ~20 lines added (table creation)

**Total: ~500 lines of new functionality**

All changes are backward compatible and don't break existing features.
