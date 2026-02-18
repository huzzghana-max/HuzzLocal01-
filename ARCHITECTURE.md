# HUZZ - SYSTEM ARCHITECTURE & DATA FLOW

## 🏗️ HIGH-LEVEL ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (React + TypeScript)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Navbar      │  │   Pages      │  │  Components          │  │
│  │  - Logo      │  │  - SignIn    │  │  - ProtectedRoute    │  │
│  │  - Nav Items │  │  - Dashboards│  │  - DashboardSidebar  │  │
│  │  - Auth Menu │  │  - Messaging │  │  - Theme Provider    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         ↓                  ↓                     ↓                │
│         └──────────────────┴─────────────────────┘               │
│                      ↓                                            │
│           ┌────────────────────────┐                             │
│           │   State Management     │                             │
│           │  - LocalStorage (JWT)  │                             │
│           │  - React State         │                             │
│           │  - Theme Context       │                             │
│           └────────────────────────┘                             │
│                      ↓                                            │
│           ┌────────────────────────┐                             │
│           │   HTTP Client (Axios)  │                             │
│           │  Base URL:             │                             │
│           │  localhost:5000/api    │                             │
│           └────────────────────────┘                             │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓ HTTPS/HTTP
┌─────────────────────────────────────────────────────────────────┐
│                   SERVER (Express.js)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Auth Routes  │  │ API Routes   │  │ File Upload  │           │
│  │ - Register   │  │ - Messaging  │  │ - Multer     │           │
│  │ - Login      │  │ - Settings   │  │ - /uploads   │           │
│  │ - JWT Verify │  │ - Services   │  │ - Validation │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         ↓                  ↓                     ↓                │
│         └──────────────────┴─────────────────────┘               │
│                      ↓                                            │
│           ┌────────────────────────┐                             │
│           │   Middleware           │                             │
│           │  - CORS                │                             │
│           │  - JSON Parser         │                             │
│           │  - JWT Verification    │                             │
│           │  - Error Handler       │                             │
│           └────────────────────────┘                             │
│                      ↓                                            │
│           ┌────────────────────────┐                             │
│           │   Database Layer       │                             │
│           │  - MySQL Connection    │                             │
│           │  - Query Builder       │                             │
│           │  - Transaction Handle  │                             │
│           └────────────────────────┘                             │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓ TCP/IP
┌─────────────────────────────────────────────────────────────────┐
│                   DATABASE (MySQL)                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 11 Tables:                                                 │ │
│  │ - users (core authentication)                              │ │
│  │ - services (vendor services)                               │ │
│  │ - messages (1-to-1 messaging)                              │ │
│  │ - service_providers (provider details)                     │ │
│  │ - events (event management)                                │ │
│  │ - bookings (service bookings)                              │ │
│  │ - payments (payment tracking)                              │ │
│  │ - reviews (ratings & reviews)                              │ │
│  │ - tickets (event tickets)                                  │ │
│  │ - appointments (scheduling - future)                       │ │
│  │ - notifications (activity logs - future)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

                      ↓ File Storage
┌─────────────────────────────────────────────────────────────────┐
│               FILE SYSTEM (/public/uploads)                       │
│  - Service Images                                                 │
│  - Profile Images                                                 │
│  - Portfolio Images                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTHENTICATION FLOW

```
User Registration
    ↓
[POST /api/auth/register]
    ├─ Validate input
    ├─ Hash password with bcrypt (10 rounds)
    ├─ Insert into users table
    └─ Generate JWT token
    ↓
Return: { token, user }
    ↓
[Client] Store in localStorage
    ├─ token
    ├─ user (JSON)
    └─ rememberMe (optional)


User Login
    ↓
[POST /api/auth/login]
    ├─ Query user by email
    ├─ Compare password with bcrypt
    ├─ If valid:
    │   └─ Generate JWT token
    └─ If invalid: throw error
    ↓
Return: { token, user }
    ↓
[Client] Store in localStorage & redirect to dashboard


Protected API Call
    ↓
[Client] Include header
    ├─ Authorization: "Bearer {token}"
    ↓
[Server] verifyToken middleware
    ├─ Extract token from header
    ├─ Verify with JWT secret
    ├─ Decode payload { id, name, email, role }
    ├─ Attach to req: req.userId, req.userRole
    └─ Call next()
    ↓
[Route Handler] Use req.userId & req.userRole
    ↓
Return response or error
```

---

## 📨 MESSAGING FLOW

```
User A sends message to User B

Step 1: Fetch Conversations
    ↓
User A → [GET /api/conversations]
    ↓
Server Query:
    SELECT DISTINCT
        CASE 
            WHEN sender_id = {userId} THEN receiver_id
            ELSE sender_id
        END as user_id,
        u.name, u.email, u.profile_image,
        MAX(m.message) as last_message,
        COUNT(CASE WHEN is_read=0 THEN 1 END) as unread_count
    FROM messages m
    JOIN users u ON (u.id = receiver_id OR u.id = sender_id)
    WHERE sender_id = {userId} OR receiver_id = {userId}
    GROUP BY user_id
    ↓
Response: [Conversation[], ...]


Step 2: Fetch Messages with User B
    ↓
User A → [GET /api/messages/{userBId}]
    ↓
Server Query:
    SELECT m.*, u1.name as sender_name, u2.name as receiver_name
    FROM messages m
    JOIN users u1 ON m.sender_id = u1.id
    JOIN users u2 ON m.receiver_id = u2.id
    WHERE (sender_id = {userA} AND receiver_id = {userB})
       OR (sender_id = {userB} AND receiver_id = {userA})
    ORDER BY created_at ASC
    ↓
Response: Message[]


Step 3: Send Message
    ↓
User A → [POST /api/messages]
Body: { recipientId, message }
    ↓
Server:
    INSERT INTO messages (sender_id, receiver_id, message, is_read, created_at)
    VALUES ({userAId}, {recipientId}, {message}, false, NOW())
    ↓
Response: { success, message }


Step 4: Mark as Read
    ↓
User A → [PUT /api/messages/{userBId}/read]
    ↓
Server:
    UPDATE messages
    SET is_read = true
    WHERE receiver_id = {userA} AND sender_id = {userB}
    ↓
Response: { success }
```

---

## 📦 SERVICE MANAGEMENT FLOW

```
Provider Creates Service

Step 1: Open Add Service Dialog
    ↓
[Frontend] 
    - Initialize form state
    - Clear previous values
    - Set dialog.open = true


Step 2: Fill Form & Select Image
    ↓
[Frontend]
    - User enters: title, description, category, price, duration, availability
    - User selects image file
    - FileReader generates preview (base64)


Step 3: Submit
    ↓
User → [POST /api/vendor/services]
    ├─ Headers: Authorization: "Bearer {token}"
    ├─ Content-Type: multipart/form-data
    └─ Body:
        - form fields (title, description, etc.)
        - image file (binary)
    ↓
Server Middleware:
    ├─ verifyToken → req.userId, req.userRole
    ├─ upload.single('image') → req.file = { filename, path, mimetype, size }
    ↓
Server Endpoint:
    ├─ Extract: title, description, category, price, etc.
    ├─ Validate required fields
    ├─ Image path: `/uploads/{timestamp}-{random}.{ext}`
    ├─ INSERT INTO services:
    │   - vendor_id = req.userId
    │   - All form fields
    │   - image = `/uploads/{filename}`
    │   - created_at = NOW()
    ├─ Return: { success: true, serviceId }
    ↓
Frontend:
    ├─ Close dialog
    ├─ Show success message
    ├─ Refetch all services
    ├─ Refresh grid display
    └─ Clear form


Update Service
    ↓
User → [PUT /api/vendor/services/{serviceId}]
    ├─ With optional new image
    ├─ Verify ownership: vendor_id == req.userId
    ├─ UPDATE services SET { fields }
    ↓
Response: { success }


Delete Service
    ↓
User → [DELETE /api/vendor/services/{serviceId}]
    ├─ Verify ownership
    ├─ DELETE FROM services WHERE id = {serviceId}
    ├─ (Note: image file not deleted - consider cleanup)
    ↓
Response: { success }


Fetch All Services (by Vendor)
    ↓
[GET /api/vendor/services]
    ↓
Server Query:
    SELECT * FROM services
    WHERE vendor_id = {req.userId}
    ORDER BY created_at DESC
    ↓
Response: Service[]
    ↓
Frontend: Render grid with services
```

---

## ⚙️ SETTINGS FLOW

```
User Updates Settings

Step 1: Load Settings
    ↓
User → [GET /api/settings]
    ├─ Authorization: Bearer {token}
    ↓
Server:
    SELECT notification_preferences, privacy_settings
    FROM users WHERE id = {req.userId}
    ↓
Response: 
    {
        notifications: {
            emailNotifications: true,
            pushNotifications: true,
            messageNotifications: true,
            bookingNotifications: true,
            paymentNotifications: true
        },
        privacy: {
            profileVisibility: 'public',
            allowMessagesFromAnyone: true
        }
    }


Step 2: Update Profile
    ↓
User → [PUT /api/settings/profile]
    ├─ Headers: Authorization: Bearer {token}, multipart/form-data
    ├─ Body: { name, email, newPassword?, profileImage? }
    ↓
Server:
    ├─ Verify email not already taken (if changed)
    ├─ If newPassword: hash with bcrypt
    ├─ If profileImage:
    │   - Save file to /public/uploads/
    │   - Store path in DB
    ├─ UPDATE users SET { fields }
    ├─ Return updated user data


Step 3: Update Notifications
    ↓
User → [PUT /api/settings/notifications]
Body: {
    emailNotifications: boolean,
    pushNotifications: boolean,
    messageNotifications: boolean,
    bookingNotifications: boolean,
    paymentNotifications: boolean
}
    ↓
Server:
    UPDATE users
    SET notification_preferences = JSON_OBJECT(
        'emailNotifications', {value},
        'pushNotifications', {value},
        ...
    )
    WHERE id = {req.userId}


Step 4: Update Privacy
    ↓
User → [PUT /api/settings/privacy]
Body: {
    profileVisibility: 'public' | 'private',
    allowMessagesFromAnyone: boolean
}
    ↓
Server:
    UPDATE users
    SET privacy_settings = JSON_OBJECT(...)
    WHERE id = {req.userId}
```

---

## 🎯 ROLE-BASED ACCESS CONTROL

```
Admin User
    ↓
[Dashboard Routes]
    ├─ /admin-dashboard (ProtectedRoute requiredRole="admin")
    │   └─ Users Management (CRUD)
    │   └─ Analytics View
    │   └─ System Settings
    ├─ /messaging (ProtectedRoute)
    └─ /settings (ProtectedRoute)
    ↓
[Sidebar Menu]
    ├─ Dashboard
    ├─ Users (All, Organizers, Providers)
    ├─ Analytics
    ├─ System Settings
    ├─ Messages
    └─ Settings


Organizer User
    ↓
[Dashboard Routes]
    ├─ /organizer-dashboard (ProtectedRoute requiredRole="organizer")
    │   └─ View Events
    │   └─ View Bookings
    │   └─ Browse Vendors
    ├─ /browse-vendors (Public-ish, with navbar)
    ├─ /messaging (ProtectedRoute)
    └─ /settings (ProtectedRoute)
    ↓
[Sidebar Menu]
    ├─ Dashboard
    ├─ Events
    ├─ Bookings
    ├─ Browse Vendors
    ├─ Messages
    ├─ Settings
    └─ Portfolio (links to browse-vendors)


Provider User
    ↓
[Dashboard Routes]
    ├─ /provider-dashboard (ProtectedRoute requiredRole="provider")
    │   └─ Services Overview
    │   └─ Manage Bookings
    │   └─ Manage Services Button → /vendor-services
    ├─ /vendor-services (ProtectedRoute requiredRole="provider")
    │   └─ Create/Edit/Delete Services
    │   └─ Upload Images
    ├─ /vendor-profile (ProtectedRoute requiredRole="provider")
    ├─ /messaging (ProtectedRoute)
    └─ /settings (ProtectedRoute)
    ↓
[Sidebar Menu]
    ├─ Dashboard
    ├─ Services
    ├─ Bookings
    ├─ Messages
    ├─ Settings
    └─ Portfolio (links to /vendor-services)


Route Protection Logic:
    ↓
1. ProtectedRoute checks localStorage for token
2. If no token → Navigate to /signin
3. If requiredRole specified:
    ├─ Get user from localStorage
    ├─ If role !== requiredRole
    │   └─ Redirect to appropriate dashboard for that role
4. If all checks pass → Render component
```

---

## 🔄 API REQUEST/RESPONSE CYCLE

```
Frontend Request
    ├─ axios.METHOD(url, [body], { headers })
    ├─ Headers always include:
    │   ├─ Content-Type: application/json (or multipart for files)
    │   └─ Authorization: Bearer {JWT} (if protected)
    └─ Body: JSON or FormData

    ↓
Express Middleware (server.js)
    ├─ CORS check
    ├─ JSON parse
    ├─ Static files serve
    ├─ Route match
    └─ If verifyToken required:
        └─ Extract JWT from Authorization header
        └─ Verify with JWT_SECRET
        └─ Decode payload
        └─ Attach to req object

    ↓
Route Handler
    ├─ Validate input
    ├─ Check authorization (ownership, role)
    ├─ Query database
    ├─ Transform response
    └─ Send JSON response

    ↓
Frontend Response Handler
    ├─ axios.then((response) => {
    │   - response.data = response body
    │   - response.status = HTTP status
    │   - Update UI
    │ })
    ├─ .catch((error) => {
    │   - error.response.data = error message
    │   - error.response.status = HTTP status
    │   - Show error alert
    │ })
```

---

## 📊 DATA RELATIONSHIPS

```
Users (Core)
    ├─ 1 ← → Many Messages (sender_id, receiver_id)
    ├─ 1 ← → Many Services (vendor_id)
    ├─ 1 ← → Many Service Providers (user_id)
    ├─ 1 ← → Many Events (organizer_id)
    └─ 1 ← → Many Bookings (provider_id, organizer_id)

Events
    ├─ 1 ← → Many Bookings (event_id)
    ├─ 1 ← → Many Tickets (event_id)
    └─ FK: organizer_id → Users

Bookings
    ├─ 1 ← → Many Payments (booking_id)
    ├─ 1 ← → Many Reviews (booking_id)
    ├─ 1 ← → Many Messages (booking_id)
    ├─ FK: event_id → Events
    ├─ FK: provider_id → Users
    └─ FK: organizer_id → Users

Services
    ├─ Many ← → One ServiceProvider
    └─ FK: vendor_id → Users

Messages
    ├─ FK: sender_id → Users
    ├─ FK: receiver_id → Users
    └─ FK: booking_id → Bookings (optional)
```

---

## 🔌 API ENDPOINT SUMMARY

| Method | Endpoint | Role | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | All | Create account |
| POST | /api/auth/login | All | Authenticate |
| GET | /api/vendor/services | Provider | List services |
| POST | /api/vendor/services | Provider | Create service |
| PUT | /api/vendor/services/:id | Provider | Update service |
| DELETE | /api/vendor/services/:id | Provider | Delete service |
| GET | /api/messages/:id | All | Get messages |
| GET | /api/conversations | All | Get conversations |
| POST | /api/messages | All | Send message |
| PUT | /api/messages/:id/read | All | Mark read |
| GET | /api/settings | All | Get settings |
| PUT | /api/settings/profile | All | Update profile |
| PUT | /api/settings/notifications | All | Update notifs |
| PUT | /api/settings/privacy | All | Update privacy |
| GET | /api/vendors | Public | List vendors |
| GET | /api/vendor/profile | Public | Get vendor details |
| GET | /api/health | Public | Health check |

---

**This document provides a complete picture of system architecture, data flow, and integration points.**
