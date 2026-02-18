# Ngrok Setup for Huzz Event Platform

## 1. Start Backend Server

In a terminal:

```
cd huzz/server
npm install
env-cmd -f .env node server.js
```
Or simply:
```
npm run dev
```

## 2. Start Frontend

In a new terminal:

```
cd huzz
npm install
npm run dev
```

## 3. Expose Backend with Ngrok

In a new terminal:

```
ngrok http 5000
```

Copy the HTTPS forwarding URL (e.g. `https://random-id.ngrok-free.app`).

## 4. Update Frontend API URL

Edit `.env` in the `huzz` folder:

```
VITE_API_BASE_URL=https://random-id.ngrok-free.app/api
```

Restart the frontend dev server after changing `.env`.

## 5. CORS

The backend is already configured to allow ngrok URLs via the `CORS_ORIGIN` variable in `server/.env`.

## 6. Access the App

- Frontend: http://localhost:5173
- Backend (public): https://random-id.ngrok-free.app

You can now access the backend API from anywhere using the ngrok URL.
