# Service Booking System - Implementation Guide

## Overview
The complete service booking system has been successfully implemented with:
- Service booking functionality on BrowseVendors page
- Organizer dashboard showing their bookings
- Provider dashboard showing incoming booking requests
- Status management (pending, confirmed, rejected, completed, cancelled)
- Messaging integration with bookings

---

## Features Implemented

### 1. **Booking Services (Organizers)**

#### Location: Browse Vendors Page
- Navigate to **Browse Vendors** page
- Click "View Details" on any approved service
- Click **"Book Now"** button in the dialog
- Fill in:
  - **Booking Date** (required)
  - **Notes** (optional - for special requests)
- Click **"Book Service"** to confirm
- Success message displays and redirects to organizer dashboard

#### Backend Endpoint:
```
POST /api/service-bookings
Headers: Authorization: Bearer {token}
Body: {
  service_id: number,
  booking_date: string (YYYY-MM-DD),
  notes: string (optional)
}
Response: { message: string, bookingId: number }
```

---

### 2. **Organizer Dashboard - View Bookings**

#### Location: Organizer Dashboard
- New **"Service Bookings"** section below events
- Shows all bookings made by the organizer
- Columns:
  - **Service**: Name of the booked service
  - **Vendor**: Name of the service provider
  - **Booking Date**: When the service is scheduled
  - **Status**: Current booking status (pending/confirmed/rejected/completed/cancelled)
  - **Notes**: Any special requests or notes
  - **Actions**: Message button to contact the vendor

#### Backend Endpoint:
```
GET /api/my-bookings
Headers: Authorization: Bearer {token}
Response: [
  {
    id: number,
    service_id: number,
    vendor_id: number,
    service_title: string,
    vendor_name: string,
    booking_date: string,
    notes: string,
    status: string,
    created_at: string
  }
]
```

---

### 3. **Provider Dashboard - Manage Bookings**

#### Location: Provider Dashboard
- Updated **"Bookings"** section with service booking requests
- Filters:
  - **Pending Requests**: New bookings waiting for confirmation
  - **Confirmed**: Accepted bookings
  - **Completed**: Finished bookings

#### Columns:
  - **Service**: Name of the requested service
  - **Organizer**: Name of the person who booked
  - **Booking Date**: When the service is scheduled
  - **Status**: Current status
  - **Actions**: "View Details" button

#### Dialog Actions:
- **Pending bookings**: Shows "Accept Booking" button
- Confirming a booking changes status from "pending" to "confirmed"
- View organizer's notes/requests in the details dialog

#### Backend Endpoints:
```
GET /api/provider-bookings
Headers: Authorization: Bearer {token}
Response: [...same format as my-bookings...]

PUT /api/service-bookings/:bookingId
Headers: Authorization: Bearer {token}
Body: { status: 'confirmed' | 'rejected' | 'completed' | 'cancelled' }
Response: { message: string }
```

---

### 4. **Database Schema**

#### Table: `service_bookings`
```sql
CREATE TABLE service_bookings (
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
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
)
```

---

## Workflow Example

### Step 1: Organizer Books a Service
1. Organizer logs in
2. Navigate to **Browse Vendors**
3. Find an approved service
4. Click **"View Details"** → **"Book Now"**
5. Select date and add notes
6. Click **"Book Service"**
7. Booking appears in **Organizer Dashboard** with status "pending"

### Step 2: Provider Receives Request
1. Provider logs into **Provider Dashboard**
2. Sees new booking in **"Pending Requests"** tab
3. Clicks **"View Details"** to see booking information
4. Clicks **"Accept Booking"** to confirm
5. Booking status changes to "confirmed"

### Step 3: Communication
1. Organizer can click **"Message"** button in their bookings list
2. Redirects to messaging page with the provider
3. Both can communicate about the booking

### Step 4: Completion
1. After service is completed
2. Provider can update status to "completed"
3. Booking appears in **"Completed"** tab

---

## Key Components Modified

### Frontend Files:
- **BrowseVendors.tsx**: Added booking modal, book button, and booking handler
- **OrganizerDashboard.tsx**: Added service bookings section to display organizer's bookings
- **ProviderDashboard.tsx**: Updated to fetch and manage incoming service bookings

### Backend Files:
- **server/server.js**: Added 4 new API endpoints for booking management
- **server/db.js**: Added service_bookings table schema

---

## Status Transitions

```
pending (initial)
  ↓
confirmed or rejected
  ↓ (if confirmed)
completed or cancelled
```

**Statuses:**
- **pending**: Awaiting vendor confirmation
- **confirmed**: Vendor accepted the booking
- **rejected**: Vendor declined the booking
- **completed**: Service has been delivered
- **cancelled**: Booking was cancelled by either party

---

## Integration with Messaging

The booking system includes a **Message** button that:
- Takes organizers to the messaging page with the vendor
- Pre-fills the vendor ID in the query parameters
- Allows real-time communication about the booking details

---

## API Authentication

All booking endpoints require authentication:
- Include JWT token in Authorization header
- Token obtained after login
- Token stored in localStorage as 'token'
- Tokens expire after 7 days

Example:
```javascript
headers: {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}
```

---

## Error Handling

The system handles:
- Missing authentication (redirects to sign in)
- Invalid dates (past dates rejected)
- Missing required fields
- Invalid service IDs
- Service not found
- Database errors

All errors return appropriate HTTP status codes and error messages.

---

## Testing Checklist

- [ ] Can book a service as organizer
- [ ] Booking appears on organizer dashboard
- [ ] Provider receives booking request
- [ ] Provider can confirm booking
- [ ] Status updates correctly
- [ ] Organizer can message vendor
- [ ] Multiple bookings display correctly
- [ ] Can filter bookings by status
- [ ] Previous bookings remain in history

---

## Future Enhancements

- Email notifications when booking status changes
- Booking cancellation with reason
- Review/rating system after completion
- Calendar view of bookings
- Recurring bookings
- Payment integration for service bookings

---

## Support

For issues or questions about the booking system, check:
1. Backend console logs at `http://localhost:5000`
2. Browser console for frontend errors
3. Network tab to verify API calls
4. Database tables to check data integrity
