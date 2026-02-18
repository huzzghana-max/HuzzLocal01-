# QUICK REFERENCE GUIDE

## 🚀 QUICK START

### Start Development Environment
```bash
# Terminal 1 - Backend
cd server
npm start
# Server runs on http://localhost:5000

# Terminal 2 - Frontend
npm run dev
# App runs on http://localhost:5173
```

### Default Admin Login
```
Email: root@admin.com
Password: root123
```

---

## 📱 FEATURE CHECKLIST

### ✅ Implemented Features
- [x] User authentication (register/login)
- [x] 3-role system (Admin, Organizer, Provider)
- [x] Role-based dashboards
- [x] Service management (CRUD)
- [x] Image uploads
- [x] Messaging system
- [x] User settings (account, notifications, privacy)
- [x] Theme toggling (light/dark)
- [x] Protected routes
- [x] Responsive design

### 🏗️ In Development/Planned
- [ ] Booking system (partially schema exists)
- [ ] Payment processing
- [ ] Event management
- [ ] Reviews & ratings
- [ ] Real-time notifications (WebSockets)
- [ ] Advanced admin analytics

---

## 🔑 KEY FILES TO MODIFY

### Frontend Changes
| File | Purpose | When to Change |
|------|---------|---|
| `src/App.tsx` | Add/modify routes | New pages/routes |
| `src/pages/*` | Page components | UI/feature changes |
| `src/components/*` | Reusable components | Shared UI elements |
| `src/themes/theme.ts` | Color & style | Design changes |

### Backend Changes
| File | Purpose | When to Change |
|------|---------|---|
| `server/server.js` | API endpoints | New API routes |
| `server/db.js` | Database schema | Database changes |

### Configuration
| File | Setting | Default |
|------|---------|---------|
| `server/db.js` | MySQL credentials | root:@localhost |
| `server/db.js` | JWT secret | 'your-secret-key...' |
| `src/pages/*.tsx` | API URL | 'http://localhost:5000' |

---

## 🔄 COMMON TASKS

### Add New API Endpoint
1. Define in `server/server.js`
2. Add verifyToken middleware if protected
3. Call from frontend with `axios.get/post/put/delete`
4. Handle response/errors

### Add New Page
1. Create file in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with `<ProtectedRoute>` if needed
4. Add to sidebar if dashboard-related

### Add New Role
1. Add to users table ENUM in `db.js`
2. Add case in DashboardSidebar.tsx `getMenuItems()`
3. Create new dashboard component
4. Add routes in App.tsx

### Upload File Handling
1. Use `<input type="file">` in frontend
2. Create FormData with file
3. Send with `Content-Type: multipart/form-data`
4. Server uses multer middleware
5. Files saved to `/public/uploads/`

---

## 🧪 TESTING WORKFLOWS

### Test Service Creation (Provider)
1. Sign in with provider credentials
2. Go to Provider Dashboard
3. Click "Manage Services"
4. Fill service form
5. Upload image
6. Submit
7. Verify service appears in list

### Test Messaging
1. Sign in with organizer
2. Go to Messaging
3. Select conversation
4. Type and send message
5. Verify message appears

### Test Settings
1. Go to Settings page
2. Update notification preferences
3. Save
4. Verify success message

---

## 🐛 TROUBLESHOOTING

### "Database is not initialized"
- ✓ Ensure MySQL is running on port 3306
- ✓ Check MySQL root user has no password
- ✓ Server will auto-create database on start

### "Cannot find module 'jsonwebtoken'"
- ✓ Run `npm install` in server directory
- ✓ Check node_modules exists

### "Port 5000 already in use"
- ✓ Kill existing process: `netstat -ano | findstr :5000`
- ✓ Stop-Process in PowerShell

### "Image upload fails"
- ✓ Check `/public/uploads/` directory exists
- ✓ Verify image size < 5MB
- ✓ Check file type is JPEG/PNG/GIF/WebP

### "Login fails but credentials correct"
- ✓ Check token in localStorage
- ✓ Verify JWT_SECRET matches frontend/backend
- ✓ Check database has user record

### "Blank page after login"
- ✓ Check browser console for errors
- ✓ Verify user role is correct
- ✓ Check route protection logic

---

## 📊 DATABASE QUERIES REFERENCE

### Get All Services by Vendor
```sql
SELECT * FROM services WHERE vendor_id = ? ORDER BY created_at DESC
```

### Get Conversations
```sql
SELECT DISTINCT m.sender_id, m.receiver_id FROM messages m
WHERE m.sender_id = ? OR m.receiver_id = ?
```

### Get Messages Between Users
```sql
SELECT m.*, u1.name as sender_name FROM messages m
JOIN users u1 ON m.sender_id = u1.id
WHERE (m.sender_id = ? AND m.receiver_id = ?) 
   OR (m.sender_id = ? AND m.receiver_id = ?)
ORDER BY m.created_at ASC
```

### Get User with Settings
```sql
SELECT id, name, email, notification_preferences, privacy_settings 
FROM users WHERE id = ?
```

---

## 🎯 COMPONENT COMMUNICATION FLOW

```
App.tsx (Routes)
  ↓
ProtectedRoute (Auth Check)
  ↓
Dashboard Pages
  ├→ DashboardSidebar (Navigation)
  │   └→ Logout, navigate to pages
  ├→ Feature Pages
  │   ├→ Messaging.tsx
  │   │   └→ axios calls to /api/messages, /api/conversations
  │   ├→ Settings.tsx
  │   │   └→ axios calls to /api/settings, /api/settings/*
  │   └→ VendorServices.tsx
  │       └→ axios calls to /api/vendor/services
  └→ Server.js (Express)
      └→ DB queries
```

---

## 📋 FILE SIZE REFERENCE

### Important Files (Lines of Code)
- `server/server.js`: 872 lines (main backend)
- `src/pages/VendorServices.tsx`: 512 lines
- `src/pages/Settings.tsx`: 470+ lines
- `src/pages/Messaging.tsx`: 410 lines
- `src/components/DashboardSidebar.tsx`: 555 lines
- `server/db.js`: 306 lines (database setup)

---

## 🔐 SECURITY NOTES

### Current Implementation
- ✅ Passwords hashed with bcrypt
- ✅ JWT for authentication
- ✅ Protected routes check token
- ✅ Owner verification for modifications
- ✅ File type validation
- ✅ File size limits

### Should Implement (Production)
- ⚠️ HTTPS only
- ⚠️ API rate limiting
- ⚠️ CORS whitelist specific domains
- ⚠️ SQL injection prevention (using parameterized queries ✅)
- ⚠️ XSS protection
- ⚠️ CSRF tokens
- ⚠️ Input validation
- ⚠️ Change JWT secret

---

## 💾 DATA PERSISTENCE

### LocalStorage Keys
- `token` - JWT authentication token
- `user` - User object (JSON string)
- `rememberMe` - Remember login preference

### Server Storage
- MySQL database (huzz_auth)
- File uploads in `/public/uploads/`

### Session Expiry
- JWT expires in 7 days
- Token must be refreshed for continued access

---

## 🎨 THEME COLORS

### Light Mode
- Primary: #1F4D5C (Deep Teal)
- Secondary: #F4A64A (Warm Amber)
- Background: #F9FAF8 (Soft Off-White)

### Dark Mode
- Primary: #153944 (Dark Teal)
- Secondary: #F2B261 (Muted Amber)
- Background: #0F1F26 (Deep Charcoal Blue)

---

## 📞 SUPPORT ENDPOINTS

### Health Check
```
GET http://localhost:5000/api/health
Response: Server status
```

### Test Authentication
```
POST http://localhost:5000/api/auth/login
Body: { email, password }
Response: { token, user }
```

---

## 🔗 USEFUL LINKS

### Documentation Files in Project
- `CODEBASE_ANALYSIS.md` - Full codebase breakdown
- `DASHBOARD_ENHANCEMENTS.md` - Dashboard features
- `SIDEBAR_FEATURES.md` - Sidebar configuration
- `README.md` - Project readme

### Port Mappings
- Frontend Dev: `localhost:5173`
- Backend API: `localhost:5000`
- MySQL DB: `localhost:3306`

---

## 🎓 LEARNING PATH FOR NEW DEVELOPERS

### Week 1: Understanding Structure
1. Read CODEBASE_ANALYSIS.md
2. Explore file structure
3. Review database schema
4. Understand routing

### Week 2: Frontend Deep Dive
1. Study React components
2. Learn Material-UI usage
3. Understand state management
4. Review axios API calls

### Week 3: Backend Deep Dive
1. Study Express routes
2. Learn database queries
3. Understand JWT flow
4. Review error handling

### Week 4: Full Stack Features
1. Add new endpoint
2. Create new page
3. Integrate API call
4. Test end-to-end

---

## ✨ QUICK WIN IMPROVEMENTS

### Easy to Add (Low Complexity)
1. [ ] Add more dashboard stats
2. [ ] Enhance service filtering
3. [ ] Add search functionality
4. [ ] Improve error messages
5. [ ] Add loading skeletons
6. [ ] Better empty states

### Medium Complexity
1. [ ] Implement pagination
2. [ ] Add service ratings
3. [ ] Implement notifications
4. [ ] Add filters/sorting
5. [ ] Email templates

### High Complexity
1. [ ] Real-time messaging (WebSockets)
2. [ ] Payment integration
3. [ ] Advanced analytics
4. [ ] Machine learning recommendations
5. [ ] Mobile app

---

**Last Updated**: Jan 2026  
**Status**: Fully Functional - Production Ready Foundation  
**Next Priority**: Booking system completion
