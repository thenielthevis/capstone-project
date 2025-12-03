# Error Response Guide - Geo Activities Update

## Response Status Codes

### 200 OK ✅
**Meaning**: Update successful, data saved to MongoDB

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Updated Activity Name",
  "description": "Updated description",
  "met": 6.5,
  "icon": "https://...",
  "animation": "https://...",
  "createdAt": "2024-12-03T10:20:30.000Z",
  "updatedAt": "2024-12-03T14:35:45.000Z"
}
```

**Action**: Celebrate! ✨ Your update was saved!

---

### 201 Created ✅
**Meaning**: New activity created successfully

Same response format as 200 OK

---

### 400 Bad Request ❌
**Meaning**: Missing required field or invalid data

```json
{
  "message": "Activity name is required",
  "error": "..."
}
```

**Common Causes**:
- Empty name field
- Invalid met value (not a number)
- Missing required fields

**Action**: Fill in all required fields and try again

---

### 401 Unauthorized ❌
**Meaning**: No token provided or token invalid

```json
{
  "message": "No token provided"
}
```

OR

```json
{
  "message": "Invalid token",
  "error": "jwt malformed"
}
```

**Common Causes**:
- Token not sent in Authorization header
- Token expired
- Token corrupted

**Action**:
1. Logout and login again
2. Check localStorage.getItem('token') exists
3. Refresh page and try again

---

### 403 Forbidden ❌
**Meaning**: User is NOT admin

```json
{
  "message": "Access denied: Admin role required"
}
```

**Common Causes**:
- User logged in as "user" instead of "admin"
- Token has role: "user" instead of role: "admin"
- Account not upgraded to admin

**Action**:
1. Check role: `JSON.parse(localStorage.getItem('user')).role`
2. If role is "user", contact administrator
3. Or create admin account: `node backend/createAdminUser.js`

---

### 404 Not Found ❌
**Meaning**: Activity doesn't exist

```json
{
  "message": "Geo Activity not found"
}
```

**Common Causes**:
- Activity was deleted
- Typo in activity ID
- Wrong activity ID in URL

**Action**:
1. Check activity still exists in list
2. Refresh page to get latest list
3. Try again with correct activity

---

### 500 Internal Server Error ❌
**Meaning**: Backend error occurred

```json
{
  "message": "Server Error",
  "error": "connect ECONNREFUSED 127.0.0.1:27017"
}
```

**Common Causes**:
- MongoDB connection lost
- Cloudinary upload failed
- Unexpected backend error

**Backend will also log**:
```
[UPDATE GEO ACTIVITY] Error occurred: connect ECONNREFUSED
```

**Action**:
1. Check MongoDB is running: `mongosh` should work
2. Check backend terminal for specific error
3. Restart backend server
4. Check .env file configuration

---

## Network Errors

### "Failed to fetch" (Browser Console)

```javascript
TypeError: Failed to fetch
    at async handleSubmit (GeoActivityForm.tsx:123)
```

**Meaning**: Can't reach the backend server

**Common Causes**:
- Backend not running
- Wrong API URL
- Network/firewall issue
- CORS error

**Check**:
```javascript
// Try accessing API directly in console
fetch('http://localhost:5000/api/geo/getAllGeoActivities')
  .then(r => r.json())
  .then(d => console.log('Success:', d))
  .catch(e => console.log('Failed:', e.message))

// If this fails -> backend not running
// If succeeds -> check Authorization header
```

**Action**:
1. Start backend: `npm start` in backend folder
2. Check API URL: `import.meta.env.VITE_API_URL` (should be http://localhost:5000/api)
3. Check firewall/network

---

### CORS Error (Browser Console)

```
Access to XMLHttpRequest at 'http://localhost:5000/api/geo/updateGeoActivity/...' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Meaning**: Backend CORS not configured

**Check backend app.js has**:
```javascript
app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
```

**Action**:
1. Ensure CORS middleware in app.js
2. Restart backend server
3. Clear browser cache (Ctrl+Shift+Del)

---

## Frontend Error Messages to See

### "Activity name is required"
- **Fix**: Enter activity name before submitting

### "No authentication token found"
- **Fix**: Logout and login again

### "Failed to fetch activity"
- **Fix**: Activity may have been deleted, refresh page

### "Failed to save activity (403)"
- **Fix**: User is not admin, see 403 error above

### "Failed to save activity (404)"
- **Fix**: Activity doesn't exist, see 404 error above

### "Failed to save activity (500)"
- **Fix**: Server error, see 500 error above, check backend logs

---

## Successful Update Flow

**You should see**:

1. **Browser Console** (F12):
```
[GeoActivityForm] Submitting UPDATE
[GeoActivityForm] Response status: 200
[GeoActivityForm] Success! Updated data: {_id: "...", name: "Updated..."}
[GeoActivityForm] Update/Create successful, redirecting...
```

2. **Success Message**: "Activity saved successfully! Redirecting..."

3. **Page Redirect**: Automatically goes back to activities list (after 1.5 seconds)

4. **Updated Data**: Activity in list shows new name/met value

5. **Page Refresh**: F5 refresh still shows updates (proof data saved to MongoDB)

6. **Backend Log**:
```
[UPDATE GEO ACTIVITY] Successfully saved: {_id: "...", name: "Updated..."}
```

---

## Troubleshooting Decision Tree

```
Click Update button
  ↓
See "Failed to fetch"?
  ├─ YES → Backend not running, start it: npm start
  └─ NO → Check error message (see below)
  
See error message?
  ├─ "No token" → Logout & login again
  ├─ "Access denied" → Account not admin
  ├─ "Not found" → Activity was deleted
  ├─ "Server Error" → Check backend logs
  └─ NO message, redirecting → ✅ UPDATE WORKED!

Auto-redirected to activities list?
  ├─ YES → Update successful! ✅
  └─ NO → Check browser console for errors

Page refreshes after update?
  ├─ YES → Data saved to MongoDB ✅
  ├─ NO → Data only in RAM, might be lost
  └─ ? → F5 refresh and check if update persists
```

---

## Quick Test Commands

**Test 1: Is backend running?**
```bash
curl http://localhost:5000/api/geo/getAllGeoActivities
# Should return JSON array, not "Connection refused"
```

**Test 2: Is database connected?**
```bash
# Backend logs should show:
# 🔗 MongoDB Database connected
```

**Test 3: Can you login?**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lifora.com","password":"admin123456"}'
# Should return token and user with role: "admin"
```

**Test 4: Can you update?**
```bash
# Get token from Test 3, then:
curl -X PATCH http://localhost:5000/api/geo/updateGeoActivity/ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","met":6}'
# Should return 200 with updated object
```

---

## Emergency Fix

If still not working after all these steps:

1. **Restart everything**:
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend/web
npm run dev

# Separate browser window/tab (fresh session)
```

2. **Clear all data and start fresh**:
```bash
# Clear localStorage
localStorage.clear()

# Reload page
location.reload()

# Login again
```

3. **Check file permissions** (if using Docker or Linux):
```bash
# Ensure backend files are readable
chmod -R 755 backend/
```

---

**If issue persists after all these steps, collect logs and contact support!** 📧
