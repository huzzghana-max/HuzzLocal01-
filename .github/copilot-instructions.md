# Huzz - AI Coding Agent Instructions

## Project Overview
**Huzz** is a role-based event/service marketplace platform built with React + TypeScript + Vite frontend and Node.js/Express backend with MySQL database. Three primary user roles: **organizer**, **provider**, **admin**.

## Architecture

### Frontend (`src/`)
- **Framework**: React 19 + TypeScript + Vite
- **UI Library**: Material-UI (MUI) with Emotion styling
- **Routing**: React Router v6 with protected role-based routes
- **HTTP Client**: Axios (hardcoded to `http://localhost:5000`)

### Backend (`server/`)
- **Framework**: Express.js
- **Database**: MySQL with connection pooling
- **Auth**: JWT tokens + bcryptjs password hashing
- **Port**: 5000

### Key Directory Structure
- `src/pages/` - Page components (HomePage, SignIn, SignUp, 4 main pages)
- `src/pages/dashboards/` - Role-specific dashboards (3 dashboard types)
- `src/components/ProtectedRoute.tsx` - Role-based route protection
- `src/themes/` - Theme configuration system with orange/blue/green/purple presets
- `server/db.js` - Database schema & auth functions
- `server/server.js` - Express routes for /api/auth/*

## Critical Patterns & Workflows

### Authentication Flow
1. User submits email/password to `/api/auth/login` (server.js)
2. Server validates credentials, returns JWT token + user object
3. Frontend stores `token` and `user` (serialized) in localStorage
4. `ProtectedRoute` component checks localStorage and validates role matching

**Key Detail**: User object is stored as JSON string; always parse with `JSON.parse(localStorage.getItem('user'))`

### Role-Based Access Control
- Dashboard routes redirect to role's own dashboard if user lacks permissions
- Three roles: `organizer`, `provider`, `admin` - stored in `users.role` (ENUM)
- SignUp defaults role to `organizer` if not specified; see server.js L21

### Database Setup
Runs automatically on server startup via `initializeDatabase()`:
- Creates `huzz_auth` database
- Schema: `users`, `service_providers`, `events`, `bookings` (see server/db.js lines 25-80+)
- Foreign keys tie service_providers and events to users.id

### Build & Development Commands
```bash
npm run dev      # Start Vite dev server (frontend on :5173)
npm run build    # TypeScript check + Vite production build
npm run lint     # ESLint check (from eslint.config.js)
npm run preview  # Preview production build locally
```

Server must be run separately: `cd server && node server.js`

## Common Tasks & Code Locations

| Task | Location | Pattern |
|------|----------|---------|
| Add new page | `src/pages/NewPage.tsx` | Wrap with `<LayoutWithNavbar>` in App.tsx if needs navbar |
| Add protected page | `src/pages/dashboards/` | Wrap route with `<ProtectedRoute requiredRole="...">` |
| Auth endpoints | `server/server.js` lines 16-55 | POST /api/auth/register, /api/auth/login |
| User data access | Navbar.tsx L22-37, ProtectedRoute.tsx L13-14 | `localStorage.getItem('user')` then `JSON.parse()` |
| Theme customization | `src/themes/config.ts` | Update `themePresets` object; currently hardcoded to orange primary |
| API calls | SignIn.tsx L15-20 | axios.post to localhost:5000 hardcoded |

## Project Conventions

1. **No environment variables** - Server port (5000), JWT secret, DB credentials hardcoded in code
2. **Theme system ready but unused** - config.ts has presets but app doesn't switch themes; currently uses inline styles or MUI defaults
3. **localStorage as state** - No Context/Redux; auth state lives in browser storage
4. **Component styling** - Mix of inline styles (SignIn.tsx) and MUI sx prop; inconsistent approach
5. **Error handling** - Try/catch in async functions; errors surfaced to UI via state (see SignIn.tsx L33)

## Critical Files to Understand First
1. ../src/App.tsx - Route structure & role-based guards
2. ../server/server.js - Auth endpoints
3. ../src/components/ProtectedRoute.tsx - Permission logic
4. ../server/db.js - Schema definition
5. ../src/themes/config.ts - Theme system (not actively used)

## Debugging Checklist
- **Frontend won't load**: Ensure `npm run dev` running AND server on port 5000
- **Login fails**: Check server is running (`node server.js` in `server/` dir), MySQL is running
- **Protected routes redirect unexpectedly**: Verify token AND user JSON in localStorage; check role name matches EXACTLY
- **Build errors**: Run `npm run build` to catch TypeScript errors; watch out for hardcoded localhost:5000
