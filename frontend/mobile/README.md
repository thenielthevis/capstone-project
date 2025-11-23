# Lifora Mobile App 📱

This is the mobile application for the Lifora health and fitness tracking platform built with [Expo](https://expo.dev).

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the sample environment file
cp .env.sample .env

# Check your configuration
node checkEnv.js
```

**Important:** Update the `EXPO_PUBLIC_API_URL` in `.env` with your backend server address:
- **Physical Device**: Use your computer's IP (run `ipconfig` to find it)
- **Android Emulator**: Use `http://10.0.2.2:5000/api`
- **iOS Simulator**: Use `http://localhost:5000/api`

### 3. Start the Backend Server
In a separate terminal:
```bash
cd ../../backend
npm start
```

### 4. Start the Mobile App
```bash
npx expo start
```

Choose your platform:
- Press `a` for Android emulator
- Press `i` for iOS simulator  
- Scan QR code for physical device

## 🔧 Troubleshooting

Having connection issues? See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

**Quick diagnostic:**
```bash
node testConnection.js
```

**Common fixes:**
- ✅ Restart Expo after changing `.env`: `npx expo start --clear`
- ✅ Ensure backend is running on port 5000
- ✅ Verify device and computer are on same WiFi
- ✅ Check firewall isn't blocking port 5000

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
