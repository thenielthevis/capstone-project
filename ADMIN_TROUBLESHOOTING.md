# Admin System - Troubleshooting & Setup Guide

## ❌ Current Issue: HTML Response Instead of JSON

**Error Message:**
```
Unexpected token '<', "<!doctype "... is not valid JSON
Response status: 200
Response headers: text/html
```

This means the backend is returning HTML (likely an error page) instead of JSON.

---

## ✅ Solution Steps

### Step 1: Verify Backend is Running Correctly

Open terminal and navigate to backend:
```bash
cd backend
npm start
```

**Look for these messages:**
```
🔗 MongoDB Database connected
🚀 Server running at http://localhost:5000
[ADMIN ROUTES] Incoming request: GET /api/admin/users
[ADMIN ROUTES] Checking admin middleware...
```

If you see errors, check:
- ✅ `.env` file exists with `DB_URI` and `JWT_SECRET`
- ✅ MongoDB is running
- ✅ Port 5000 is available

### Step 2: Verify Admin User Exists

Create admin if not already created:
```bash
node createAdminUser.js
```

Expected output:
```
✅ Connected to MongoDB
✅ Admin user created successfully!
📋 Admin Credentials:
   Email: admin@lifora.com
   Password: admin123456
```

Or if already exists:
```
⚠️ Admin user already exists!
Email: admin@lifora.com
Username: admin
```

### Step 3: Login as Admin

1. Go to http://localhost:5173/login
2. Enter:
   - **Email:** `admin@lifora.com`
   - **Password:** `admin123456`
3. Should redirect to `/admin/dashboard`

### Step 4: Check Browser Console Logs

Open **Developer Tools (F12)** → **Console** tab

You should see:
```
Fetching from: /api/admin/users?page=1&limit=10
Token: Present
Response status: 200
Response headers: application/json
Fetched data: {users: Array(5), pagination: {…}}
```

If you see `Response headers: text/html`, the backend didn't load the admin routes properly.

### Step 5: Test Backend Directly

Open PowerShell and test the API:

```powershell
# Get token first (login)
$loginResponse = Invoke-WebRequest -Uri 'http://localhost:5000/api/users/login' `
  -Method POST `
  -ContentType 'application/json' `
  -Body '{"email":"admin@lifora.com","password":"admin123456"}' | ConvertFrom-Json

$token = $loginResponse.token

# Test admin users endpoint
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

Invoke-WebRequest -Uri 'http://localhost:5000/api/admin/users' -Headers $headers
```

Expected response:
```json
{
  "users": [...],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

## 🔍 Backend Console Logs to Look For

When fetching users, you should see in backend terminal:

```
[ADMIN ROUTES] Incoming request: GET /api/admin/users?page=1&limit=10
[ADMIN ROUTES] Checking admin middleware...
[Admin Middleware] Token received: eyJhbGciOiJIUzI1NiIs...
[Admin Middleware] Decoded token: {id: '...', email: 'admin@lifora.com', role: 'admin'}
[Admin Middleware] Admin verified, proceeding...
[ADMIN ROUTES] GET /users - Handling request
[getAllUsers] Query params: {role: undefined, page: '1', limit: '10'}
[getAllUsers] Filter: {} Skip: 0 Limit: 10
[getAllUsers] Found users: 5 Total: 5
```

---

## 🚨 Common Issues & Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| `No token provided` | JWT token not in request | Make sure you're logged in as admin |
| `Access denied: Admin role required` | User doesn't have admin role | Check database if user.role === 'admin' |
| `text/html response` | Route not found or middleware failing | Restart backend with `npm start` |
| `Connection refused` | Backend not running | Start backend: `npm start` |
| `Cannot GET /api/admin/users` | Admin routes not registered | Check `app.js` has `app.use('/api/admin', adminRoutes)` |

---

## 📋 Files to Check

1. **Backend Routes:**
   - `backend/routes/adminRoutes.js` ✅ Has logging
   - `backend/app.js` ✅ Registers admin routes

2. **Backend Middleware:**
   - `backend/middleware/admin.js` ✅ Updated with logging

3. **Backend Controller:**
   - `backend/controllers/adminControllers.js` ✅ getAllUsers updated with logging

4. **Frontend:**
   - `frontend/web/src/pages/AdminUsers.tsx` ✅ Has enhanced logging

---

## ✅ Next Steps After Fix

1. Verify users appear in table
2. Test search functionality
3. Test role filter (All Users / Regular Users / Admins)
4. Test delete user feature
5. Verify pagination works

**If still stuck:** Check backend console logs for exact error message! 🎯
