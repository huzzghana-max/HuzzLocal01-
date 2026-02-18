# Local Database Setup & Structure

## Quick Start

### 1. Prerequisites
- Node.js (v18+) installed
- MySQL server running locally on port 3306
- Default MySQL root user with no password (or configure in `.env`)

### 2. Installation Steps

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies (from root)
npm install

# Start MySQL (Windows)
# Using MySQL Command Line or MySQL Workbench

# Reset and initialize database
npm run db:init

# Start development servers
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend (from root)
npm run dev
```

### 3. Default Admin Account
```
Email: root@admin.com
Password: root123
```

---

## Environment Configuration

### server/.env
```dotenv
# Server
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Database
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=huzz_auth
MYSQL_PORT=3306

# JWT
JWT_SECRET=your-secret-key-change-this

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### .env (Frontend)
```dotenv
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Huzz
```

---

## Database Structure

### Tables Overview

#### `users` - Core user accounts
- Primary table for all system users
- Stores authentication, profiles, settings
- Roles: `organizer`, `provider`, `admin`

**Key Fields:**
- `id` - Primary key
- `email` - Unique identifier for login
- `password` - Bcrypted password hash
- `role` - User role (determines permissions)
- `profile_image` - Avatar/profile picture path
- `notification_preferences` - JSON settings
- `privacy_settings` - JSON settings

---

#### `service_providers` - Provider business details
- Extended profile for users with `provider` role
- Stores service type, rates, availability, ratings
- One-to-one relationship with users table

**Key Fields:**
- `user_id` - Foreign key to users
- `business_name` - Service business name
- `service_type` - Category of service
- `hourly_rate` - Pricing
- `portfolio_images` - JSON array of image URLs
- `availability_status` - `available` or `unavailable`
- `rating` - Average rating (0-5)

---

#### `services` - Individual services offered
- Each service belongs to a provider
- Stores service details, pricing, images
- One-to-many relationship with service_providers

**Key Fields:**
- `provider_id` - Foreign key to service_providers
- `name` - Service name
- `description` - Detailed description
- `price` - Service price
- `image_url` - Service image
- `category` - Service category

---

#### `events` - Events created by organizers
- Events created by users with `organizer` role
- Stores event details, dates, locations

**Key Fields:**
- `organizer_id` - Foreign key to users
- `event_name` - Event title
- `description` - Event details
- `event_date` - When event occurs
- `location` - Event location

---

#### `service_bookings` - Booking transactions
- Records when organizers book services from providers
- Tracks booking status and payment

**Key Fields:**
- `organizer_id` - Who is booking (organizer)
- `provider_id` - Who is providing (provider)
- `service_id` - Which service
- `booking_date` - When service is needed
- `status` - `pending`, `confirmed`, `completed`, `cancelled`
- `notes` - Special requests/notes

---

#### `messages` - Messaging system
- Direct messages between users
- Conversation tracking

**Key Fields:**
- `sender_id` - Who sent message
- `recipient_id` - Who receives message
- `message` - Message text
- `is_read` - Read status

---

#### `images` - Image/file uploads tracking
- Tracks all uploaded images in system
- Used for recovery and cleanup

**Key Fields:**
- `user_id` - Owner of image
- `file_path` - Storage location
- `file_type` - MIME type
- `upload_date` - When uploaded

---

## Database Initialization

The database is automatically initialized on first server start by `server/db.js`:

1. **Connection Setup** - Connects to MySQL without a specific database
2. **Database Creation** - Creates `huzz_auth` database (drops existing if present)
3. **Table Creation** - Creates all tables with proper structure
4. **Seed Data** - Populates with default admin account
5. **Pool Ready** - Main connection pool becomes available for API requests

### Manual Reset
If you need to manually reset the database:

```bash
cd server
npm run db:init
```

Or directly in MySQL:
```sql
DROP DATABASE IF EXISTS huzz_auth;
```

Then restart the server - it will auto-recreate everything.

---

## Common Tasks

### Add a New User Manually
Connect to MySQL and run:
```sql
USE huzz_auth;
INSERT INTO users (name, email, password, role) 
VALUES ('John Doe', 'john@example.com', '$2a$10...hashedpassword...', 'provider');
```

### View All Tables
```bash
cd server
npm run db:inspect
```

### Backup Database
```bash
mysqldump -u root -p huzz_auth > backup.sql
```

### Restore Database
```bash
mysql -u root -p huzz_auth < backup.sql
```

---

## Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:3306"
- MySQL is not running
- Solution: Start MySQL server
- On Windows: Open Services → Start MySQL80 or MySQL57
- Or use MySQL Workbench → Server → Start Server

### "Access denied for user 'root'@'localhost'"
- MySQL password is incorrect in `.env`
- Check `MYSQL_PASSWORD` in `server/.env`
- If using empty password (default), ensure `MYSQL_PASSWORD=`

### "Database huzz_auth not found"
- Database hasn't been initialized yet
- Start the server once - it auto-creates the database
- Or manually run: `npm run db:init`

### Tables not created
- Check server logs for SQL errors
- Verify MySQL user has CREATE permissions
- Delete `huzz_auth` database manually and restart server

---

## Architecture Notes

### Three-Tier Structure
1. **Frontend** (React + TypeScript)
   - Port 5173 (Vite dev server)
   - Components in `/src/pages` and `/src/components`
   - API calls through `src/api.js`

2. **Backend** (Express.js + Node.js)
   - Port 5000
   - Database in `server/db.js`
   - Routes in `server/server.js`
   - Seed data in `server/seed.js`

3. **Database** (MySQL)
   - Port 3306 (local)
   - Database: `huzz_auth`
   - Auto-initialized on server start

### Authentication Flow
1. User registers/logs in through frontend
2. Backend validates and generates JWT token
3. Frontend stores token in localStorage
4. Subsequent requests include token in Authorization header
5. Backend verifies token before allowing access

### Image Upload Flow
1. Frontend sends file to `/api/upload` endpoint
2. Backend stores in `public/uploads/` directory
3. Returns URL to frontend
4. Frontend saves URL to database
5. Frontend displays image using returned URL

---

## Next Steps

### To Add Features
1. Create API endpoint in `server/server.js`
2. Add table schema in `server/db.js` if needed
3. Create frontend page/component in `src/pages/`
4. Add route in `src/App.tsx`
5. Test both frontend and backend

### To Deploy
1. See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
2. Set environment variables on hosting platform
3. Use production MySQL database
4. Configure CORS for production domain

---

## Support

For issues or questions:
1. Check the [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common tasks
2. Review [CODE_CHANGES.md](CODE_CHANGES.md) for recent modifications
3. Check server console logs for errors
4. Verify MySQL is running and credentials are correct
