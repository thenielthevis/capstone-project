# Troubleshooting Axios Errors

This guide helps you fix connection issues between the mobile app and backend API.

## Quick Fix Checklist

### 1. **Check Backend is Running**
```powershell
cd backend
npm start
```
You should see: `Server is running on port 5000`

### 2. **Verify Your .env File Exists**
```powershell
cd frontend/mobile
# Check if .env exists
ls .env
```

If it doesn't exist:
```powershell
cp .env.sample .env
```

### 3. **Configure Correct API URL**

Run this helper script to check your configuration:
```powershell
cd frontend/mobile
node checkEnv.js
```

**Edit `.env` file with the correct URL based on your device:**

#### For Physical Device (Phone/Tablet):
1. Get your computer's IP address:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" under your WiFi adapter

2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api
   ```
   Example: `http://192.168.1.100:5000/api`

3. **Important**: Ensure both device and computer are on the **same WiFi network**

#### For Android Emulator:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

#### For iOS Simulator:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. **Test Connection**
```powershell
cd frontend/mobile
node testConnection.js
```

You should see: `✓ Server is reachable`

### 5. **Restart Expo**
**Critical:** After changing `.env`, you MUST restart Expo:

```powershell
# Stop current Expo (Ctrl+C)
npx expo start --clear
```

## Common Issues

### Issue: "Network Error" or "ECONNREFUSED"

**Cause:** App can't reach the backend server

**Solutions:**
1. ✅ Verify backend is running (`npm start` in backend folder)
2. ✅ Check firewall isn't blocking port 5000
3. ✅ Ensure correct IP address in `.env`
4. ✅ Computer and device on same WiFi

### Issue: "Request failed with status code 404"

**Cause:** API endpoint doesn't exist

**Solutions:**
1. ✅ Check API URL ends with `/api` 
2. ✅ Verify route in backend matches frontend call
3. ✅ Look at backend console for the exact route being called

### Issue: "timeout of 60000ms exceeded"

**Cause:** Server took too long to respond

**Solutions:**
1. ✅ Check backend logs for errors
2. ✅ Verify database connection is working
3. ✅ Test with smaller images for food logging

### Issue: Changes to .env not working

**Cause:** Expo caches environment variables

**Solutions:**
1. ✅ Stop Expo (Ctrl+C)
2. ✅ Clear cache: `npx expo start --clear`
3. ✅ Or: Delete `.expo` folder and restart

### Issue: "401 Unauthorized"

**Cause:** Missing or invalid auth token

**Solutions:**
1. ✅ Log in again
2. ✅ Check auth middleware on backend
3. ✅ Verify token storage in mobile app

## Backend API Routes

The food logging API uses these endpoints:

- `POST /api/food-logs/create` - Create food log
- `GET /api/food-logs/user` - Get user's food logs
- `GET /api/food-logs/stats` - Get nutrition stats
- `GET /api/food-logs/:id` - Get specific food log
- `PATCH /api/food-logs/:id` - Update food log
- `DELETE /api/food-logs/:id` - Delete food log
- `DELETE /api/food-logs/bulk/delete` - Delete multiple logs

## Testing in Browser

You can test if backend is accessible:

1. Open browser on your phone
2. Navigate to: `http://YOUR_COMPUTER_IP:5000`
3. Should see: `{"status":"ok","message":"Capstone API Server Running"}`

If this doesn't work, there's a network connectivity issue.

## Network Debugging

### Check Windows Firewall
```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=5000
```

### Test Port is Open
From another device on the network:
```bash
# On Mac/Linux
nc -zv YOUR_COMPUTER_IP 5000

# On Windows (PowerShell)
Test-NetConnection -ComputerName YOUR_COMPUTER_IP -Port 5000
```

### View Backend Logs
When you make a request, backend should log:
```
[2025-11-21T10:30:45.123Z] POST /api/food-logs/create from 192.168.1.50
```

If you don't see this, the request isn't reaching the server.

## Still Having Issues?

1. **Check all logs:**
   - Backend console output
   - Expo console in terminal
   - Mobile app console (React Native debugger)

2. **Run diagnostic scripts:**
   ```powershell
   cd frontend/mobile
   node checkEnv.js
   node testConnection.js
   ```

3. **Try the simplest setup first:**
   - Use Android Emulator with `http://10.0.2.2:5000/api`
   - This eliminates network variables

4. **Enable verbose logging:**
   - Check browser console / network tab
   - Look at detailed axios logs in mobile app

## Pro Tips

✅ Always restart Expo after changing `.env`
✅ Keep backend running in a separate terminal
✅ Watch backend logs while testing
✅ Use `console.log` to trace request flow
✅ Test connection before testing complex features
