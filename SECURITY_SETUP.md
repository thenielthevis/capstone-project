# Security Setup Guide

## ⚠️ IMPORTANT: Environment Variables Configuration

All sensitive credentials and API keys have been moved to environment variables. You **MUST** create `.env` files before running any part of the application.

## 📁 Required .env Files

### 1. Backend (.env)
Location: `backend/.env`

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DB_URI=your_mongodb_connection_string

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email (SMTP)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_EMAIL=your_smtp_email
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_NAME=Your App Name
SMTP_FROM_EMAIL=noreply@yourapp.com

# JWT Authentication
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_TIME=7d
JWT_REFRESH_EXPIRES_IN=30d
```

### 2. Mobile App (.env)
Location: `frontend/mobile/.env`

```env
# API Configuration
API_URL=http://your-server-ip:5000/api

# Gemini AI
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

### 3. Web Frontend (.env)
Location: `frontend/web/.env`

```env
# API Configuration
API_URL=http://localhost:5000/api

# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# FatSecret API (for nutrition data)
VITE_FATSECRET_CLIENT_ID=your_fatsecret_client_id
VITE_FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret
```

### 4. Food Calorie Tracker (.env)
Location: `Food Calorie Tracker/.env`

```env
# Gemini AI
VITE_GEMINI_API_KEY=your_gemini_api_key

# FatSecret API
VITE_FATSECRET_CLIENT_ID=your_fatsecret_client_id
VITE_FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret
```

## 🔑 How to Get API Keys

### MongoDB
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get your connection string from "Connect" > "Connect your application"

### Cloudinary
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get credentials from Dashboard

### Gemini AI
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key

### FatSecret API
1. Register at [FatSecret Platform](https://platform.fatsecret.com/api/)
2. Create an application
3. Get your Client ID and Client Secret

### Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a project
3. Add a web app
4. Copy the configuration values

### JWT Secret
Generate a random secret key:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## ⚠️ Security Best Practices

1. **NEVER commit `.env` files to git**
   - Already configured in `.gitignore`
   
2. **Use different credentials for development and production**

3. **Rotate API keys regularly**

4. **Use strong, random JWT secrets**
   - Minimum 64 characters
   - Mix of letters, numbers, and symbols

5. **Limit API key permissions**
   - Only grant necessary access
   - Use environment-specific keys

6. **Keep `.env.sample` files updated**
   - But NEVER include real values

## 🚀 Quick Setup

1. Copy the `.env.sample` file to `.env` in each directory:
   ```bash
   # Backend
   cd backend
   cp .env.sample .env
   
   # Mobile
   cd ../frontend/mobile
   cp .env.sample .env
   
   # Web
   cd ../web
   cp .env.sample .env
   
   # Food Tracker
   cd ../../"Food Calorie Tracker"
   cp .env.example .env
   ```

2. Fill in your actual credentials in each `.env` file

3. Verify your `.gitignore` includes `.env`

4. Test the application

## 🔍 Verify Security

Run this command to check for exposed secrets:
```bash
# Check if .env files are tracked
git ls-files | grep .env$

# Should return nothing. If it returns files, remove them:
git rm --cached .env
git commit -m "Remove .env from tracking"
```

## ❌ What Was Fixed

The following security issues were identified and resolved:

1. **FatSecret API credentials** were hardcoded in:
   - `Food Calorie Tracker/src/services/fatSecretService.js`
   - `frontend/web/src/services/fatSecretService.ts`
   - ✅ Now using `VITE_FATSECRET_CLIENT_ID` and `VITE_FATSECRET_CLIENT_SECRET`

2. **Firebase credentials** were exposed in:
   - `frontend/mobile/.env.sample`
   - ✅ Replaced with placeholder values

3. **Missing environment variables** in sample files:
   - ✅ Added all required FatSecret and Firebase variables to `.env.sample` files
   - ✅ Added `JWT_REFRESH_EXPIRES_IN` to backend `.env.sample`

## 📞 Need Help?

If you encounter any issues with environment configuration, check:
1. File paths are correct
2. No typos in variable names
3. Values don't have quotes (unless they contain spaces)
4. Firebase config uses `EXPO_PUBLIC_` prefix for Expo
5. Vite config uses `VITE_` prefix for web apps
