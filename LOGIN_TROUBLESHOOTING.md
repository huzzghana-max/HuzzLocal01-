# Login Troubleshooting Guide

## Quick Diagnosis

Run this command to diagnose the login issue:

```bash
cd server
node diagnose-login.js
```

This will check:
- ✅ MySQL connection
- ✅ Database exists
- ✅ Users table exists
- ✅ Admin user exists
- ✅ Admin password is correct

---

## Common Login Issues & Solutions

### Issue 1: "Database is not initialized"

**Symptoms:**
- Backend console shows: "Database is not initialized. Please ensure MySQL is running on port 3306."
- Login doesn't work at all

**Solution:**
```bash
# Step 1: Make sure MySQL is running
# On Windows, check Services or start MySQL Workbench

# Step 2: Initialize the database
cd server
npm run db:init

# Step 3: Restart the server
npm start
```

---

### Issue 2: "User not found" or "Invalid password"

**Symptoms:**
- Login attempts fail with "User not found" or "Invalid password"
- Admin user doesn't exist

**Solution:**
```bash
# Check if admin user exists
cd server
node diagnose-login.js

# If admin user doesn't exist, create it:
npm run db:init

# Or manually add admin:
mysql -u root -D huzz_auth -e "
INSERT INTO users (name, email, password, role) 
SELECT 'Admin User', 'root@admin.com', '\$2a\$10\$...' as hashed_password, 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'root@admin.com');
"
```

**Try login with:**
- Email: `root@admin.com`
- Password: `root123`

---

### Issue 3: "401 Unauthorized" or "No token provided"

**Symptoms:**
- Login seems successful but dashboard won't load
- Console shows: "401 Unauthorized" or "No token provided"

**Solution:**
1. Check browser console (F12 → Console tab)
2. Check if token is being saved to localStorage:
   ```javascript
   // In browser console:
   localStorage.getItem('token')
   localStorage.getItem('user')
   ```
3. If empty, try logging in again
4. Check server logs for JWT_SECRET errors

---

### Issue 4: "CORS error" or network request blocked

**Symptoms:**
- Browser console shows CORS error
- Request to localhost:5000 is blocked

**Solution:**
1. Make sure server is running on port 5000:
   ```bash
   cd server
   npm start
   ```
2. Check frontend .env has correct API URL:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```
3. Restart frontend:
   ```bash
   npm run dev
   ```

---

### Issue 5: "Connection refused" on port 5000

**Symptoms:**
- Browser shows: "Failed to connect to localhost:5000"
- Login page loads but can't submit form

**Solution:**
```bash
# Check if server is running
cd server
npm start

# You should see:
# ✅ Server is running on http://0.0.0.0:5000
# Connected to database!
```

---

### Issue 6: "MySQL connection refused" port 3306

**Symptoms:**
- Server console shows: "connect ECONNREFUSED 127.0.0.1:3306"
- Database is not initialized

**Solution:**
```bash
# Check if MySQL is running
# On Windows:
# - Open Services (services.msc)
# - Look for MySQL80 or MySQL57
# - Right-click → Start

# Or use MySQL Workbench:
# - Click Server → Start Server

# Verify connection:
mysql -u root -p

# Test with Python/Node:
node -e "require('mysql2/promise').createConnection({host:'localhost',user:'root'}).then(()=>console.log('Connected')).catch(e=>console.log('Failed:',e.message))"
```

---

### Issue 7: "Access denied for user 'root'@'localhost'"

**Symptoms:**
- Server shows: "Error: access denied for user 'root'@'localhost'"

**Solution:**
1. Check MySQL password in `server/.env`:
   ```env
   MYSQL_PASSWORD=
   ```
   (Should be empty for default installation)

2. If you have a MySQL password:
   ```env
   MYSQL_PASSWORD=your_actual_password
   ```

3. Test connection:
   ```bash
   mysql -u root -p
   # Enter your password when prompted
   ```

---

## Step-by-Step Fresh Setup

If none of the above work, do a complete fresh setup:

```bash
# 1. Stop any running servers (Ctrl+C)

# 2. Make sure MySQL is running
#    (Check Windows Services or start MySQL Workbench)

# 3. Initialize fresh database
cd server
npm run db:init

# 4. Start the server
npm start
# Should see:
# ✅ Server is running on http://0.0.0.0:5000
# Connected to database!

# 5. In another terminal, start frontend
npm run dev
# Should see:
# ✓ ready in XXXms

# 6. Open browser to http://localhost:5173

# 7. Click "Sign In" and login with:
#    Email: root@admin.com
#    Password: root123
```

---

## Debug Steps in Browser

### Check Console
1. Open browser (F12)
2. Go to Console tab
3. Try logging in
4. Look for error messages

### Check Network
1. Open browser (F12)
2. Go to Network tab
3. Try logging in
4. Look for request to `localhost:5000/api/auth/login`
5. Click on request and check:
   - Status: Should be 200
   - Response: Should have `token` and `user`

### Check Local Storage
1. Open browser (F12)
2. Go to Application tab
3. Click Local Storage → http://localhost:5173
4. Look for `token` and `user` keys
5. Token should start with `eyJ...`

---

## Verify Setup

Run these commands to verify everything is set up correctly:

```bash
# 1. Check MySQL connection
mysql -u root

# 2. Check database exists
mysql -u root -e "SHOW DATABASES;" | grep huzz_auth

# 3. Check tables exist
mysql -u root -D huzz_auth -e "SHOW TABLES;"

# 4. Check admin user exists
mysql -u root -D huzz_auth -e "SELECT email, role FROM users WHERE role='admin';"

# 5. Check server is on correct port
netstat -ano | findstr :5000

# 6. Check frontend is on correct port
netstat -ano | findstr :5173
```

---

## Server Logs

When troubleshooting, watch the server logs carefully. The server should show:

**On startup:**
```
🚀 Server is running on http://0.0.0.0:5000
📍 Database initialized or already exists
✅ Connected to database!
```

**On login request:**
```
Login request received: { email: 'root@admin.com' }
Token decoded: { id: 1, name: 'Admin User', email: 'root@admin.com', role: 'admin' }
User logged in successfully: { id: 1, name: 'Admin User', email: 'root@admin.com', role: 'admin' }
```

**On error:**
```
Login error: User not found
Login error: Invalid password
Login error: Database is not initialized
```

---

## Useful Commands

```bash
# Reinitialize everything
cd server
npm run db:init
npm start

# Reset admin password
mysql -u root -D huzz_auth -c "
DELETE FROM users WHERE email='root@admin.com';
"
# Then run db:init again to recreate

# View all users
mysql -u root -D huzz_auth -e "SELECT id, email, role FROM users;"

# View login requests in real-time
cd server
npm start
# Watch console output

# Test API endpoint directly
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@admin.com","password":"root123"}'
```

---

## Still Having Issues?

Check these files:
1. [LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md) - Database setup guide
2. [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database structure
3. [server/.env](server/.env) - Server configuration
4. [.env](.env) - Frontend configuration
5. `server/server.js` - Login endpoint
6. `server/db.js` - Login logic
7. `src/pages/SignIn.tsx` - Frontend login form

Run diagnostic:
```bash
node server/diagnose-login.js
```

Check logs:
- Server console (npm start output)
- Browser console (F12)
- Browser Network tab (F12)
- MySQL error log (if running)
