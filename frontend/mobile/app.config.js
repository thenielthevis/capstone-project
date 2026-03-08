import 'dotenv/config';

export default {
  expo: {
    name: "Lyniva",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#111827",
      image: "./assets/images/splash.png",
      resizeMode: "contain"
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
          locationAlwaysAndWhenInUsePermission: "Allow Lyniva to use your location",
          locationAlwaysPermission: "Allow Lyniva to use your location"
        }
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/notification-icon.png",
          color: "#6366f1",
        }
      ],
      "expo-background-fetch",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow Lyniva to access your photos",
          cameraPermission: "Allow Lyniva to access your camera"
        }
      ],
      [
        "expo-sensors",
        {
          motionPermission: "Allow Lyniva to access your motion sensors"
        }
      ],
      "expo-font",
      "expo-sqlite",
      "./withAndroidQueries.js"
    ],
    assetBundlePatterns: ["assets/fonts/*", "assets/sounds/*"],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "6b89e6f9-8ac6-494a-80d4-21ed8413e4ed"
      },
      MAPTILER_KEY: process.env.EXPO_PUBLIC_MAPTILER_KEY,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      geminiApiKey2: process.env.EXPO_PUBLIC_GEMINI_API_KEY2,
      geminiApiKey3: process.env.EXPO_PUBLIC_GEMINI_API_KEY3,
      geminiApiKey4: process.env.EXPO_PUBLIC_GEMINI_API_KEY4,
      geminiApiKey5: process.env.EXPO_PUBLIC_GEMINI_API_KEY5,
    },
    owner: "capstone.project"
  }
};