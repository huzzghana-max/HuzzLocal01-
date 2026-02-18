# Huzz Project - Quick Start Guide

## 📁 Project Structure

```
reactpro/
└── huzz/                      # Main project folder
    ├── server/                # Backend (Express.js + Node.js)
    │   ├── server.js          # Main server file
    │   ├── db.js              # Database initialization
    │   ├── package.json       # Backend dependencies
    │   ├── .env               # Server configuration
    │   └── node_modules/
    │
    ├── src/                   # Frontend source code
    │   ├── pages/             # Page components
    │   │   ├── SignIn.tsx     # Login page
    │   │   └── ...
    │   ├── components/        # Reusable components
    │   ├── api.js             # API client
    │   └── main.tsx
    │
    ├── public/                # Static files
    │   └── uploads/           # User uploads
    │
    ├── package.json           # Frontend dependencies
    ├── .env                   # Frontend configuration
    ├── vite.config.ts         # Vite configuration
    ├── tsconfig.json          # TypeScript config
    │
    └── [Documentation files]
        ├── LOCAL_DATABASE_SETUP.md
        ├── DATABASE_SCHEMA.md
        ├── LOGIN_TROUBLESHOOTING.md
        └── ...
```

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)
```bash
# Run from huzz folder
.\start.ps1
```
This will:
- ✅ Kill any existing Node processes
- ✅ Start backend server (port 5000)
- ✅ Start frontend dev server (port 5173)
- ✅ Display login credentials

### Option 2: Manual Setup

**Terminal 1 - Backend:**
```bash
cd huzz/server
npm install
npm run db:init    # Initialize database once
npm start
```

**Terminal 2 - Frontend:**
```bash
cd huzz
npm install
npm run dev
```

### Step 3: Login

1. Open browser: **http://localhost:5173**
2. Click **"Sign In"**
3. Enter credentials:
   - Email: `root@admin.com`
   - Password: `root123`
4. Click **"Sign In"** button

---

## 📊 System Architecture

### Three-Tier Setup

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend)                    │
│           http://localhost:5173 (React + Vite)          │
│                                                          │
│  - Sign In Page (SignIn.tsx)                            │
│  - Dashboard Pages                                      │
│  - Component Library (MUI)                              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ API Calls to /api/*
                     │
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND SERVER                          │
│        http://localhost:5000 (Express.js)               │
│                                                          │
│  - Authentication (/api/auth/*)                         │
│  - User Management                                      │
│  - Service Booking                                      │
│  - Upload Handling                                      │
└────────────────────┬────────────────────────────────────┘
                     │ Database Queries
                     │
┌────────────────────▼────────────────────────────────────┐
│                  MySQL DATABASE                          │
│          localhost:3306 (huzz_auth)                      │
│                                                          │
│  - users table                                          │
│  - service_providers table                              │
│  - services table                                       │
│  - service_bookings table                               │
│  - And 4 more tables                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🔑 Configuration Files

### `server/.env` (Backend)
```dotenv
# Server
PORT=5000
HOST=0.0.0.0

# Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=huzz_auth
MYSQL_PORT=3306

# JWT
JWT_SECRET=your-secret-key-change-this

# CORS
CORS_ORIGIN=http://localhost:5173
```

### `.env` (Frontend)
```dotenv
# Frontend
VITE_API_BASE_URL=http://localhost:5000
```

---

## 📱 Frontend Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | React app entry point |
| `src/App.tsx` | Main app component & routing |
| `src/pages/SignIn.tsx` | Login form |
| `src/api.js` | Axios client for API calls |
| `src/components/ProtectedRoute.tsx` | Route authentication |

---

## 🔧 Backend Entry Points

| File | Purpose |
|------|---------|
| `server/server.js` | Main Express app & routes |
| `server/db.js` | Database initialization & queries |
| `server/.env` | Server configuration |
| `server/package.json` | Backend dependencies |

---

## 🛠️ Useful Commands

### Backend (from `huzz/server/`)
```bash
npm start              # Start server
npm run dev           # Start with auto-reload (nodemon)
npm run db:init       # Initialize/reset database
npm run db:seed       # Seed sample data
node check-db.js      # Verify database
node test-login.js    # Test login API
```

### Frontend (from `huzz/`)
```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Run ESLint
```

### System
```bash
# Check if port is in use
netstat -ano | findstr :5000    # Check port 5000
netstat -ano | findstr :5173    # Check port 5173

# Kill Node processes
taskkill /F /IM node.exe

# Check MySQL connection
mysql -u root
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Cannot find module 'mysql2'"
**Solution:**
```bash
cd server
npm install
npm start
```

### Issue 2: "Port 5000 already in use"
**Solution:**
```bash
# Kill existing processes
taskkill /F /IM node.exe

# Then start again
npm start
```

### Issue 3: "Database huzz_auth not found"
**Solution:**
```bash
cd server
npm run db:init
npm start
```

### Issue 4: "Login fails" on frontend
**Solution:**
1. Check if backend is running: `http://localhost:5000` in browser
2. Check if frontend is on port 5173: `http://localhost:5173`
3. Check browser console (F12) for errors
4. Check server logs for error messages
5. Verify credentials: `root@admin.com` / `root123`

### Issue 5: "CORS error"
**Solution:**
- Verify `.env` CORS_ORIGIN includes frontend URL
- Restart server: `npm start`

---

## 🔐 Authentication Flow

```
1. User enters email & password in SignIn.tsx
   ↓
2. API call: POST /api/auth/login
   ↓
3. Backend checks database for user
   ↓
4. Backend verifies password hash
   ↓
5. Backend generates JWT token
   ↓
6. Frontend receives token & user info
   ↓
7. Frontend stores token in localStorage
   ↓
8. Frontend redirects based on user role
   - admin → /admin-dashboard
   - provider → /provider-dashboard
   - organizer → /organizer-dashboard
```

---

## 📊 Database

### Initialization
Database is created automatically on first server start or manually:
```bash
cd server
npm run db:init
```

### Tables (8 total)
1. **users** - User accounts
2. **service_providers** - Provider profiles
3. **services** - Individual services
4. **events** - Events created by organizers
5. **service_bookings** - Booking transactions
6. **messages** - User messaging
7. **images** - Uploaded images
8. **reviews** - Service ratings

### Default Credentials
```
Email: root@admin.com
Password: root123
Role: admin
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/upload` - Upload file

### Services
- `GET /api/services` - List all services
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings
- `GET /api/my-bookings` - Get user bookings
- `POST /api/service-bookings` - Create booking
- `PUT /api/service-bookings/:id` - Update booking

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| [LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md) | Complete database setup guide |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Database structure reference |
| [LOGIN_TROUBLESHOOTING.md](LOGIN_TROUBLESHOOTING.md) | Login debugging guide |
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick command reference |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Project architecture |

---

## 🔄 Development Workflow

1. **Start Servers**
   ```bash
   # Terminal 1
   cd server && npm start
   
   # Terminal 2
   npm run dev
   ```

2. **Open Browser**
   ```
   http://localhost:5173
   ```

3. **Make Changes**
   - Frontend: Files in `src/` auto-reload
   - Backend: Restart `npm start` to see changes

4. **Test Features**
   - Login with admin credentials
   - Navigate to dashboards
   - Test services, bookings, etc.

5. **Check Logs**
   - Backend: Console where `npm start` runs
   - Frontend: Browser console (F12)

---

## ✅ Verification Checklist

- [ ] MySQL is running on port 3306
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Database `huzz_auth` exists
- [ ] Admin user `root@admin.com` exists
- [ ] Browser shows "Welcome Back" on Sign In page
- [ ] Can login with admin credentials
- [ ] Redirects to admin dashboard after login

---

## 📞 Debugging

### Check Backend Status
```bash
curl http://localhost:5000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"root@admin.com","password":"root123"}'
```

### Check Frontend Status
```bash
# In browser console
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('user'))
```

### Check Database
```bash
node server/check-db.js
```

### Test Login
```bash
node server/test-login.js
```

---

## 🎯 Next Steps

1. ✅ Start both servers
2. ✅ Login with admin account
3. ✅ Create test users (organizer, provider)
4. ✅ Test booking system
5. ✅ Test messaging feature
6. ✅ Explore admin dashboard

---

## 📖 Need Help?

1. Check [LOGIN_TROUBLESHOOTING.md](LOGIN_TROUBLESHOOTING.md)
2. Check server console output
3. Check browser console (F12)
4. Run diagnostic: `node server/diagnose-login.js`
5. Review [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

---

**Happy coding! 🚀**
