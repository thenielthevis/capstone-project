import 'dotenv/config';

export default {
  expo: {
    name: "Lifora",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "cover",
      backgroundColor: "#000000" // your brand color
    },
    newArchEnabled: false,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.company.capstone"
    },
    android: {
      package: "com.company.capstone",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png"
      },
      edgeToEdgeEnabled: true,
      googleServicesFile: "./google-services.json",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "INTERNET",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS",
        "VIBRATE"
      ]
    },
    plugins: [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "expo-secure-store",
      "@maplibre/maplibre-react-native",
      "expo-video",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Lifora to use your location",
          locationAlwaysPermission: "Allow Lifora to use your location"
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/logo.png",
          color: "#ffffff"
        }
      ],
      "expo-background-fetch",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Lifora to access your photos",
          cameraPermission: "Allow Lifora to access your camera"
        }
      ],
      [
        "expo-sensors",
        {
          motionPermission: "Allow Lifora to access your motion sensors"
        }
      ],
      "expo-font",
      "expo-sqlite"
    ],
    assetBundlePatterns: ["assets/fonts/*"],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "6b89e6f9-8ac6-494a-80d4-21ed8413e4ed"
      },
      MAPTILER_KEY: process.env.EXPO_PUBLIC_MAPTILER_KEY,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY
    },
    owner: "capstone.project"
  }
};