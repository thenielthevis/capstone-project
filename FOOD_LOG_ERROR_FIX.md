# Food Log Save Error - Troubleshooting Guide

## Common Issues and Solutions

### Issue: "axios error request failed"

This error occurs when the mobile app cannot connect to the backend API. Here are the solutions:

---

## Solution 1: Check Environment Variables

### For Mobile App (.env)

1. Open `frontend/mobile/.env` file
2. Make sure it has `EXPO_PUBLIC_API_URL` (not just `API_URL`):

```env
EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:5000/api
```

**Important:**
- Use `EXPO_PUBLIC_` prefix for Expo environment variables
- Replace `YOUR_IP_ADDRESS` with your computer's actual IP address
- Do NOT use `localhost` or `127.0.0.1` when testing on physical device

### Get Your IP Address:

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.5)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

---

## Solution 2: Restart Expo Development Server

After changing `.env` file:

```bash
cd frontend/mobile
# Stop the current server (Ctrl+C)
npm start --clear
```

Or press `r` in the Expo terminal to reload

---

## Solution 3: Check Backend Server is Running

1. Open new terminal:
```bash
cd backend
npm start
```

2. You should see:
```
Server running on port 5000
Connected to MongoDB
```

3. Test the API manually:
```bash
# In browser or Postman, go to:
http://YOUR_IP_ADDRESS:5000/api/users/current
```

---

## Solution 4: Check Network Connection

### If using Physical Device:
- Phone and computer must be on **same WiFi network**
- Disable any VPN on phone or computer
- Check firewall isn't blocking port 5000

### If using Emulator:
- Android: Use `10.0.2.2` instead of localhost
- iOS: Use your computer's IP address

---

## Solution 5: Verify User is Logged In

The food log API requires authentication. Check:

1. User must be logged in
2. JWT token must be valid
3. Check console logs for "No user logged in" message

---

## Solution 6: Check Image Size

If only images fail to save:

1. Images are automatically limited to 10MB in the app
2. Backend has 50MB JSON limit
3. If still failing, images may be too compressed

---

## Solution 7: Test Backend API Directly

Use the test script:

```bash
cd backend
node test_food_log_api.js
```

Or use curl:

```bash
# Replace YOUR_TOKEN with actual JWT token
curl -X POST http://YOUR_IP:5000/api/food-logs/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inputMethod": "manual",
    "foodName": "Test Apple",
    "calories": 95,
    "servingSize": "1 apple",
    "nutrients": {"protein": 0.5, "carbs": 25}
  }'
```

---

## Debugging Steps

### 1. Enable Console Logging

The app now logs detailed information. Check:

**In Mobile App Console:**
- "Attempting to save food log..."
- "API Base URL: ..."
- "Image size: X.XX MB"
- Error details if save fails

**In Backend Console:**
- "Creating food log for user: ..."
- "Uploading image to Cloudinary..."
- "Food log saved successfully"

### 2. Check Error Messages

The app now shows specific error alerts:

- **"Network Error"** → Backend not reachable, check IP/port
- **"Authentication Error"** → Log in again
- **"Server Error"** → Check backend logs

### 3. Verify Database Connection

Make sure MongoDB is running and connected:

```bash
# Check backend/.env has:
MONGODB_URI=your_mongodb_connection_string
```

---

## Quick Checklist

Before testing, verify:

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] MongoDB is connected (check backend console)
- [ ] `.env` file has `EXPO_PUBLIC_API_URL` with correct IP
- [ ] Expo dev server restarted after changing `.env`
- [ ] User is logged in to the app
- [ ] Phone and computer on same network (if testing on device)
- [ ] No firewall blocking port 5000
- [ ] JWT token is valid (not expired)

---

## Expected Behavior

### Successful Save:
1. User analyzes food
2. Results appear immediately
3. Console shows: "Food log saved successfully"
4. Can view in History tab
5. No error alerts

### Failed Save (Non-blocking):
1. User analyzes food
2. Results still appear immediately
3. Console shows error details
4. Alert shown with specific error
5. User can still see analysis results

**Note:** Save errors don't block the user - they still get their analysis!

---

## Still Not Working?

1. Check all console logs in both mobile and backend
2. Try the test script: `node backend/test_food_log_api.js`
3. Verify routes are registered: Check `backend/app.js` has:
   ```javascript
   app.use('/api/food-logs', foodLogRoutes);
   ```
4. Check authentication middleware is working
5. Try saving without image first (manual input mode)

---

## Common .env Mistakes

❌ **Wrong:**
```env
API_URL=http://localhost:5000/api
```

✅ **Correct:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
```

❌ **Wrong:** Using localhost on physical device
✅ **Correct:** Using actual IP address

❌ **Wrong:** Forgetting to restart Expo after .env change
✅ **Correct:** Always restart: `npm start --clear`

---

## Contact Info for Error Reports

When reporting errors, include:

1. Full error message from console
2. Whether using physical device or emulator
3. Your `.env` EXPO_PUBLIC_API_URL value (hide sensitive parts)
4. Backend console output
5. Network setup (WiFi, VPN, etc.)
