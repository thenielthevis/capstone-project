# Axios Connection Fixes - Summary

## Issues Fixed

### 1. **Router Initialization Error** ❌ → ✅
**Problem:** `useRouter()` was called at module level in `axiosInstance.ts`, causing crashes.

**Fix:** Changed to import `router` directly from `expo-router` and use it only in error handler.

```typescript
// Before (WRONG)
import { useRouter } from "expo-router";
const router = useRouter(); // ❌ Crashes

// After (CORRECT)  
import { router } from "expo-router";
// Use router.replace() only when needed ✅
```

### 2. **Missing Error Logging** ❌ → ✅
**Problem:** Axios errors didn't provide enough information for debugging.

**Fix:** Added comprehensive logging throughout the request/response cycle:
- Request logging with URL and method
- Response status logging
- Detailed error logging for network vs server errors
- Configuration logging to verify baseURL

### 3. **Environment Variable Issues** ❌ → ✅
**Problem:** `.env` changes weren't taking effect, causing wrong API URLs.

**Fix:** 
- Added helper scripts to validate configuration
- Updated `.env.sample` with clear instructions
- Added documentation about restarting Expo after `.env` changes

### 4. **Poor Error Handling** ❌ → ✅
**Problem:** Generic errors made it hard to diagnose connection issues.

**Fix:** Added specific error handling for:
- Network errors (ECONNREFUSED, ENOTFOUND)
- Server errors (401, 404, 500, etc.)
- Token refresh failures
- Timeout errors

### 5. **Missing Backend Error Routes** ❌ → ✅
**Problem:** No health check endpoint or proper 404/error handlers.

**Fix:** Added to `backend/app.js`:
- Health check endpoint at `/`
- 404 handler for undefined routes
- Global error handler with detailed logging

## New Helper Scripts

### 1. `checkEnv.js`
Validates your environment configuration:
```bash
node checkEnv.js
```
- Checks if .env exists
- Validates API URL format
- Shows your network IP addresses
- Provides device-specific setup instructions

### 2. `testConnection.js`
Tests backend connectivity:
```bash
node testConnection.js
```
- Attempts to connect to configured API URL
- Provides specific error messages
- Helps diagnose network issues

### 3. `setup-check.ps1`
Complete setup verification (Windows PowerShell):
```powershell
powershell -ExecutionPolicy Bypass -File setup-check.ps1
```
- Checks Node.js and npm
- Validates .env configuration
- Tests if backend is running
- Shows network IP addresses
- Provides step-by-step recommendations

## Configuration Guide

### For Physical Devices (Recommended)

1. Find your computer's IP:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api
   ```

3. **Important:** Device and computer must be on same WiFi

### For Android Emulator

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

### For iOS Simulator

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

## Required Setup Steps

1. **Create .env file:**
   ```powershell
   cd frontend/mobile
   Copy-Item .env.sample .env
   # Edit .env with correct API URL
   ```

2. **Start backend server:**
   ```powershell
   cd backend
   npm start
   ```

3. **Verify connection:**
   ```powershell
   cd frontend/mobile
   node testConnection.js
   ```

4. **Start mobile app:**
   ```powershell
   npx expo start --clear
   ```
   Note: Use `--clear` flag to clear Expo cache after .env changes

## Code Changes Made

### `frontend/mobile/app/api/axiosInstance.ts`
- ✅ Fixed router import
- ✅ Added request/response logging
- ✅ Enhanced error handling with detailed messages
- ✅ Improved token refresh logic
- ✅ Added automatic logout on auth failure

### `frontend/mobile/app/api/foodLogApi.ts`
- ✅ Added try-catch blocks with logging
- ✅ Better error propagation

### `backend/app.js`
- ✅ Added health check endpoint at `/`
- ✅ Added 404 handler
- ✅ Added global error handler
- ✅ Improved request logging format

### Documentation
- ✅ Created `TROUBLESHOOTING.md` - comprehensive troubleshooting guide
- ✅ Updated `README.md` - added quick start and setup instructions
- ✅ Updated `.env.sample` - added detailed comments

## Testing Your Setup

### Step 1: Check Environment
```powershell
cd frontend/mobile
node checkEnv.js
```
Should show ✓ for all required configurations.

### Step 2: Test Backend Connection
```powershell
node testConnection.js
```
Should show: `✓ Server is reachable`

### Step 3: Test in Browser
On your mobile device, open browser and go to:
```
http://YOUR_COMPUTER_IP:5000
```
Should see: `{"status":"ok","message":"Capstone API Server Running"}`

### Step 4: Test Mobile App
1. Start app: `npx expo start --clear`
2. Open on device
3. Check Expo terminal for axios logs
4. Check backend terminal for request logs

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Network Error` | Can't reach backend | Check IP address, WiFi, firewall |
| `ECONNREFUSED` | Backend not running | Start backend with `npm start` |
| `404 Not Found` | Wrong API URL | Verify URL ends with `/api` |
| `401 Unauthorized` | Missing/invalid token | Log in again |
| `Timeout` | Slow connection/large image | Check network, reduce image size |

## Debugging Tips

1. **Always check logs in order:**
   - Expo terminal (mobile app)
   - Backend terminal (server)
   - Device console (React Native debugger)

2. **Enable verbose logging:**
   - All axios requests now log automatically
   - Backend logs all incoming requests
   - Look for the exact URL being called

3. **Test incrementally:**
   - First test backend health: `http://localhost:5000`
   - Then test from device: `http://YOUR_IP:5000`
   - Then test API endpoint: `http://YOUR_IP:5000/api/food-logs/user`
   - Finally test from mobile app

4. **Cache issues:**
   - Always use `npx expo start --clear` after `.env` changes
   - Delete `.expo` folder if issues persist
   - Restart Metro bundler

## Next Steps

After fixing connection issues:

1. ✅ Verify login works
2. ✅ Test food log creation
3. ✅ Test image upload
4. ✅ Check data persistence
5. ✅ Test on different networks

## Documentation References

- Full troubleshooting: `TROUBLESHOOTING.md`
- Setup instructions: `README.md`
- API documentation: `backend/FOOD_LOG_API.md`

## Quick Reference Commands

```powershell
# Check setup
node checkEnv.js

# Test connection  
node testConnection.js

# Full setup check (Windows)
powershell -ExecutionPolicy Bypass -File setup-check.ps1

# Start backend
cd backend; npm start

# Start mobile (with cache clear)
cd frontend/mobile; npx expo start --clear

# Find your IP (Windows)
ipconfig

# Find your IP (Mac/Linux)  
ifconfig
```

---

**Remember:** After any `.env` change, always restart Expo with the `--clear` flag!
