# 🔍 GEO ACTIVITY UPDATE - DEBUGGING GUIDE

## The Issue: "Failed to fetch" on Update

When you click Update button and see "Failed to fetch" error, it's usually one of these:

1. **Admin Middleware Rejecting Request** - Token doesn't have admin role
2. **File Upload Issues** - FormData not being sent correctly
3. **Server/Network Issues** - Backend not running or unreachable

---

## Step-by-Step Debug Instructions

### Step 1: Check if User is Admin

**In Browser Console (F12):**
```javascript
// Check what role the current user has
const user = JSON.parse(localStorage.getItem('user'));
console.log('Current user:', user);
console.log('User role:', user?.role);
console.log('Is admin?:', user?.role === 'admin');

// Check the token
const token = localStorage.getItem('token');
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1])); // Decode JWT payload
console.log('Token payload:', payload);
console.log('Token role:', payload.role);
```

**Expected Output:**
```
Current user: {id: "...", username: "...", email: "...", role: "admin"}
User role: "admin"
Is admin?: true

Token payload: {id: "...", email: "...", role: "admin", iat: ..., exp: ...}
Token role: "admin"
```

**If role is "user" instead of "admin":**
- You cannot access admin endpoints
- Contact admin to upgrade your account
- Or use `node backend/createAdminUser.js` to create admin account

---

### Step 2: Check Backend Logs

**What to look for when you click Update:**

```
✅ GOOD - You should see:
[UPDATE GEO ACTIVITY] Starting update for ID: 507f1f77bcf86cd799439011
[UPDATE GEO ACTIVITY] Request user: {id: "...", email: "...", role: "admin"}
[UPDATE GEO ACTIVITY] Request body fields: ['name', 'description', 'met']
[UPDATE GEO ACTIVITY] Request files: ['icon']
[UPDATE GEO ACTIVITY] Successfully saved: {...}

❌ BAD - If you see:
[Admin Middleware] User role is not admin: user
↳ Solution: Log in with admin account

❌ BAD - If you see:
[Admin Middleware] No token provided
↳ Solution: Check Authorization header is being sent

❌ BAD - If you see:
[UPDATE GEO ACTIVITY] Activity not found with ID: 507f1f77bcf86cd799439011
↳ Solution: Activity was deleted or ID is wrong
```

---

### Step 3: Check Frontend Logs

**In Browser Console (F12) when clicking Update:**

```javascript
// You should see many logs like:
[GeoActivityForm] Submitting UPDATE
[GeoActivityForm] URL: http://localhost:5000/api/geo/updateGeoActivity/...
[GeoActivityForm] Method: PATCH
[GeoActivityForm] Token: eyJhbGciOiJIUzI1NiIs...
[GeoActivityForm] Form Data: {name: "...", description: "...", met: 5, hasIcon: false, hasAnimation: false}
[GeoActivityForm] Response status: 200
[GeoActivityForm] Success! Updated data: {...}
```

---

### Step 4: Manual Test with cURL

**Test if the backend endpoint works directly:**

```bash
# 1. Get admin token
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifora.com","password":"admin123456"}'

# This returns: {"token":"eyJhbGc...", "user": {"role":"admin"}}
# Copy the token value

# 2. Test update endpoint
curl -X PATCH http://localhost:5000/api/geo/updateGeoActivity/ID_HERE \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","description":"Updated Desc","met":6}'
```

---

### Step 5: Run Automated Test

**In terminal:**

```bash
cd backend

# Run full test (creates test activity and updates it)
node testGeoActivityUpdateFull.js

# Expected output:
# ✅ Login successful!
# ✅ Fetched 2 activities
# ✅ Update successful!
# ✅ Verification successful!
# ✅ ALL TESTS PASSED!
```

---

## Common Issues & Solutions

### Issue 1: "Failed to fetch" in UI

**Root Cause**: Admin middleware rejecting request

**Solution**:
1. Check user role (Step 1 above)
2. If role is "user", it needs to be "admin"
3. Logout and login with admin account
4. Or run: `node backend/createAdminUser.js`

**Backend Log to Look For**:
```
[Admin Middleware] User role is not admin: user
```

---

### Issue 2: "No token provided" error

**Root Cause**: Token not being sent to backend

**Solution**:
1. Check token exists: `localStorage.getItem('token')`
2. Verify not expired: Check token in JWT debugger
3. Refresh browser and try again
4. Logout and login again

**Backend Log to Look For**:
```
[Admin Middleware] No token provided
```

---

### Issue 3: "Activity not found" error

**Root Cause**: ID doesn't match or activity was deleted

**Solution**:
1. Verify activity ID is correct
2. Check activity still exists in list
3. Try creating a new activity first, then updating it

**Backend Log to Look For**:
```
[UPDATE GEO ACTIVITY] Activity not found with ID: 507f1f77bcf86cd799439011
```

---

### Issue 4: Updates not saving to MongoDB

**Root Cause**: Database connection issue

**Solution**:
1. Check MongoDB is running: `mongosh` command should work
2. Check .env has correct MONGODB_URI
3. Check server logs for connection errors
4. Restart backend server

**Backend Log to Look For**:
```
🔗 MongoDB Database connected
```

---

## Quick Diagnostic Checklist

Run through these checks:

- [ ] User logged in? `localStorage.getItem('user')`
- [ ] User is admin? `user.role === 'admin'`
- [ ] Token exists? `localStorage.getItem('token')`
- [ ] Backend running? Visit `http://localhost:5000/api/geo/getAllGeoActivities`
- [ ] Database running? `mongosh` connects successfully
- [ ] Activity exists? Listed in Geo Activities page
- [ ] Activity ID correct? Check browser network tab

---

## Network Tab Analysis

**In Browser DevTools (F12 → Network tab):**

1. Click Edit on an activity
2. Click Update button
3. Look for PATCH request to `/api/geo/updateGeoActivity/...`

**Check Request:**
- ✅ Method: PATCH
- ✅ Status: 200 (success) or see error status
- ✅ Headers: Authorization header present with token
- ✅ Payload: name, description, met sent

**Check Response:**
- ✅ Status: 200
- ✅ Body: Contains updated activity object
- ✅ Response time: Should be < 1 second

---

## Enable Verbose Logging

**To get even more details, edit `frontend/web/src/pages/GeoActivityForm.tsx` and add:**

```typescript
// Before fetch
console.log('Full FormData contents:');
for (let [key, value] of formDataToSend) {
  console.log(`  ${key}:`, value);
}
```

**Or add to backend:**

```javascript
// In geoActivityController.js updateGeoActivity
console.log('[UPDATE GEO ACTIVITY] Full request:', {
  body: req.body,
  files: req.files,
  user: req.user,
  params: req.params,
});
```

---

## Still Not Working?

**Collect this info and provide it:**

1. Browser console output (copy-paste from F12)
2. Backend server logs (terminal output)
3. Network tab request/response (F12 → Network)
4. User role: `console.log(JSON.parse(localStorage.getItem('user')).role)`
5. Backend URL: `import.meta.env.VITE_API_URL` from browser console

---

## Email Admin

If you've tried all steps and still not working:

Send screenshot of:
1. Browser console (with errors)
2. Backend terminal output  
3. Network tab showing request/response
4. Current user role from localStorage

This info will help debug the issue!

---

**Remember**: 
- Updates go to MongoDB immediately when successful
- Page auto-redirects on success (you'll be taken back to list)
- Manual refresh button (↻) can reload list anytime
- All changes are permanent once saved

Good luck! 🚀
