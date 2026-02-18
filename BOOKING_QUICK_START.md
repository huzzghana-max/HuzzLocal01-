# Service Booking System - Quick Start Guide

## 🎯 For Organizers

### How to Book a Service

```
1. Dashboard Home
   ↓
2. Click "Browse Vendors"
   ↓
3. Find Service → Click "View Details"
   ↓
4. Click "Book Now" Button
   ↓
5. Fill Booking Dialog:
   - Select Booking Date (required)
   - Add Notes (optional)
   ↓
6. Click "Book Service"
   ↓
7. Success! See booking in Organizer Dashboard
```

### Organizer Dashboard - Service Bookings Section

**What you see:**
| Service | Vendor | Booking Date | Status | Notes | Actions |
|---------|--------|--------------|--------|-------|---------|
| Photography | John | 2024-12-20 | pending | Please bring | Message |
| Catering | Mary | 2024-12-21 | confirmed | 50 guests | Message |

**Status meanings:**
- 🟡 **pending** - Vendor hasn't confirmed yet
- 🟢 **confirmed** - Vendor accepted your booking
- 🔴 **rejected** - Vendor declined
- ✅ **completed** - Service done
- ⚫ **cancelled** - Booking was cancelled

**What you can do:**
- Click "Message" to chat with the vendor
- See when your service is scheduled
- Track booking status in real-time

---

## 🎯 For Service Providers

### How to Manage Booking Requests

```
1. Provider Dashboard
   ↓
2. Look at "Bookings" Section
   ↓
3. Go to "Pending Requests" Tab
   ↓
4. Click "View Details" on a booking
   ↓
5. See booking info:
   - Service Name
   - Organizer Name
   - Booking Date
   - Special Notes/Requests
   ↓
6. Click "Accept Booking" or Close (to decline)
   ↓
7. Status changes to "confirmed"
```

### Provider Dashboard - Booking Tabs

**Tab 1: Pending Requests**
- New bookings waiting for your confirmation
- Shows organizer name, date, and their notes
- "Accept Booking" button to confirm

**Tab 2: Confirmed**
- Bookings you've accepted
- Ready for delivery
- Shows all confirmed dates

**Tab 3: Completed**
- Already delivered services
- Historical record
- Shows completion date

### Booking Details Dialog

```
┌─────────────────────────────────┐
│ Booking Details                 │
├─────────────────────────────────┤
│ Service: Photography            │
│ Organizer: John Doe             │
│ Booking Date: 2024-12-20        │
│ Notes: Bring drone, sunset shot │
│ Status: pending                 │
├─────────────────────────────────┤
│ [Close] [Accept Booking]        │
└─────────────────────────────────┘
```

---

## 📊 Booking Workflow

```
                    ORGANIZER
                       ↓
                 Browses Services
                       ↓
                 Clicks "Book Now"
                       ↓
              Fills Date & Notes
                       ↓
         Creates Booking (status: pending)
                       ↓
        Appears in Organizer Dashboard
                       ↓
                    ↙      ↘
              PROVIDER      ORGANIZER
                ↓           ↓
         Receives in    Can message
         "Pending"      vendor about
         Requests       the booking
                ↓           ↓
         Confirms or   Waits for
         Declines      confirmation
                ↓
         Booking status
         changes to:
         confirmed/rejected
                ↓
           SERVICE DATE
                ↓
         After completion:
         status: completed
```

---

## 💬 Messaging Integration

### From Organizer Side:
```
Organizer Dashboard
     ↓
View Booking Row
     ↓
Click "Message" Button
     ↓
Chat with Vendor
```

### From Provider Side:
```
Provider Dashboard
     ↓
Sees booking
     ↓
Can message organizer
     ↓
Discuss details before
accepting booking
```

---

## 📱 What Each Role Sees

### ORGANIZER SEES:
- ✅ Browse all approved services
- ✅ Book any service
- ✅ View their bookings
- ✅ See booking status
- ✅ Add notes when booking
- ✅ Message vendor
- ✅ Track all bookings (pending, confirmed, completed)

### PROVIDER SEES:
- ✅ Incoming booking requests
- ✅ View booking details
- ✅ Accept/decline bookings
- ✅ See organizer info
- ✅ View booking notes
- ✅ Message organizer
- ✅ Track confirmed bookings

### ADMIN SEES:
- ✅ Approve new services
- ✅ Manage pending services
- ✅ View all bookings (system overview)

---

## 🔄 Status Flow

```
PENDING ← Initial booking state
   ↓
CONFIRMED ← Provider accepted
   ↓
COMPLETED ← Service delivered

Alternative paths:
PENDING → REJECTED ← Provider declined
PENDING → CANCELLED ← Either party cancels
CONFIRMED → CANCELLED ← Changed mind
```

---

## 🚀 Quick Tips

1. **For Organizers:**
   - Book as soon as you see a good service
   - Add detailed notes to help vendor prepare
   - Message vendors before they confirm
   - Check dashboard regularly for updates

2. **For Providers:**
   - Check Pending Requests tab daily
   - View booking details completely before accepting
   - Confirm bookings promptly
   - Message organizer if you have questions

3. **For Best Experience:**
   - Use messaging for any booking questions
   - Confirm details before the booking date
   - Keep messages professional and clear
   - Update booking status after service

---

## 📞 Need Help?

**Booking not showing?**
- Refresh the page
- Check if you're logged in
- Clear browser cache

**Can't book a service?**
- Make sure you're logged in as organizer
- Date must be in future
- Service must be approved by admin

**Provider not receiving bookings?**
- Make sure you have services listed
- Services must be approved
- Check notification area

---

## Database Tables

The booking system uses these tables:

### service_bookings
```
id (PK)
service_id (FK → services)
vendor_id (FK → users)
organizer_id (FK → users)
booking_date
notes
status (pending/confirmed/rejected/completed/cancelled)
created_at
updated_at
```

This creates the connection between:
- **Organizer** (user who books)
- **Vendor** (user who provides service)
- **Service** (what is being booked)

---

**System Ready! Start booking services! 🎉**
