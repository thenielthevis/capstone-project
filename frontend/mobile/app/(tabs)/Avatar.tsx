import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Button, Alert, Platform, Linking, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { tokenStorage } from "../../utils/tokenStorage";

export default function Avatar() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deep-link configuration matching your Unity manifest
  const deepLink = "liforacc://liforagamecc?scene=Main";
  const androidPackage = "com.UnityTechnologies.UniversalMobile3DTemplate";

  useEffect(() => {
    // Attempt to open the unity game when the Avatar tab mounts
    openDeepLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDeepLink = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch the current auth token
      const token = await tokenStorage.getToken();
      if (!token) {
        console.warn("[Avatar] No auth token found. Unity app may not be able to fetch user data.");
      }

      // Construct the deep link with query parameters
      // Note: We need to encode the values to ensure special characters don't break the URL
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

      let finalDeepLink = `${deepLink}`;
      if (deepLink.includes('?')) {
        finalDeepLink += `&token=${encodeURIComponent(token || "")}&apiUrl=${encodeURIComponent(apiUrl)}`;
      } else {
        finalDeepLink += `?token=${encodeURIComponent(token || "")}&apiUrl=${encodeURIComponent(apiUrl)}`;
      }

      if (Platform.OS === "android") {
        console.log("[Avatar] Attempting to open Unity game with deep link:", finalDeepLink);

        // Strategy 1: Try react-native-send-intent (most reliable for native intents)
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const SendIntentAndroid = require("react-native-send-intent").default;
          if (SendIntentAndroid) {
            console.log("[Avatar] Strategy 1: Using SendIntentAndroid to open package");
            try {
              // Note: react-native-send-intent openApp usually takes just the package name.
              // Handling deep links with extras often requires openAppWithData or similar, 
              // but standard behavior is often just to open the main intent.
              // For deep linking with params, the intent URI method (Strategy 3) or Linking (Strategy 2) is often better.
              // However, let's try to pass the data if the library supports it, or fall back to Linking.

              // If we strictly want to open via Scheme, Strategy 2 is actually the standard React Native way.
              // Strategy 1 is good for "launching the app" but maybe not "launching with specific data" unless customized.
              // We will rely on Strategy 2/3 for the data passing primarily.

              await SendIntentAndroid.openApp(androidPackage, {
                "token": token || "",
                "apiUrl": apiUrl
              });
              console.log("[Avatar] Strategy 1 succeeded - SendIntentAndroid opened app");
              setLoading(false);
              return;
            } catch (e: any) {
              console.warn("[Avatar] Strategy 1 failed (SendIntentAndroid):", e?.message ?? e);
            }
          }
        } catch (e) {
          console.log("[Avatar] Strategy 1 skipped - SendIntentAndroid not available");
        }

        // Strategy 2: Try direct scheme URL
        console.log("[Avatar] Strategy 2: Attempting scheme URL:", finalDeepLink);
        try {
          await Linking.openURL(finalDeepLink);
          console.log("[Avatar] Strategy 2 succeeded - Scheme URL opened");
          setLoading(false);
          return;
        } catch (e: any) {
          console.warn("[Avatar] Strategy 2 failed (scheme URL):", e?.message ?? e);
        }

        // Strategy 3: Try Intent URI with different formats
        // We need to inject the parameters into the Intent URI
        // Standard intent format: intent://<host>/<path>?<query>#Intent;scheme=<scheme>;package=<package>;end

        // Extract scheme and host from the base deep link (liforacc://liforagamecc)
        const scheme = "liforacc";
        const host = "liforagamecc";
        const params = `scene=Main&token=${encodeURIComponent(token || "")}&apiUrl=${encodeURIComponent(apiUrl)}`;

        const intentUriVariants = [
          `intent://${host}?${params}#Intent;scheme=${scheme};package=${androidPackage};end`,
          `intent://${host}?${params}#Intent;action=android.intent.action.VIEW;scheme=${scheme};package=${androidPackage};end`
        ];

        for (let i = 0; i < intentUriVariants.length; i++) {
          const intentUri = intentUriVariants[i];
          console.log(`[Avatar] Strategy 3.${i + 1}: Attempting Intent URI variant:`, intentUri);
          try {
            await Linking.openURL(intentUri);
            console.log(`[Avatar] Strategy 3.${i + 1} succeeded - Intent URI opened`);
            setLoading(false);
            return;
          } catch (e: any) {
            console.warn(`[Avatar] Strategy 3.${i + 1} failed:`, e?.message ?? e);
          }
        }

        console.warn("[Avatar] All strategies failed. This is likely a React Native Linking limitation.");
      } else {
        console.log("[Avatar] Non-Android platform, skipping deep link");
      }

      // If all attempts fail, show error state and alert
      const errorMsg = `Unable to open Unity game via deep link from React Native.\n\nThe deep link works via adb, but React Native has limitations opening custom schemes.`;
      setError(errorMsg);
      console.error("[Avatar]", errorMsg);

      Alert.alert(
        "Cannot Open Game",
        `Deep linking from React Native failed.\n\nHowever, adb commands work fine:\nadb shell am start -a android.intent.action.VIEW -d "${finalDeepLink}"\n\nTo fix this:\n1. Install react-native-send-intent\n2. Rebuild the app with proper native module linking\n3. Or rebuild with Expo development build (eas build)`,
        [
          { text: "OK" },
          { text: "Retry", onPress: openDeepLink },
          { text: "Copy ADB Command", onPress: () => onCopyLink() }
        ]
      );
    } catch (e: any) {
      const errorMsg = "Unexpected error: " + (e?.message ?? e);
      setError(errorMsg);
      console.error("[Avatar] Unexpected error:", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const onCopyLink = async () => {
    try {
      // Try to load expo-clipboard dynamically (may not be installed).
      let clipboardModule: any = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        clipboardModule = require("expo-clipboard");
      } catch (err) {
        clipboardModule = null;
      }

      if (clipboardModule && typeof clipboardModule.setStringAsync === "function") {
        await clipboardModule.setStringAsync(deepLink);
        Alert.alert("Copied", "Deep link copied to clipboard: " + deepLink);
        return;
      }

      // Fallback: if running in web-like environment with navigator.clipboard
      // @ts-ignore
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        // @ts-ignore
        await navigator.clipboard.writeText(deepLink);
        Alert.alert("Copied", "Deep link copied to clipboard: " + deepLink);
        return;
      }

      // Last resort: show the link so user can copy it manually
      Alert.alert("Manual Copy Required", "Deep link: " + deepLink);
    } catch (e: any) {
      console.error("[Avatar] Copy failed:", e?.message ?? e);
      Alert.alert("Copy failed", deepLink);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.xl }]}>
        Avatar
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.text, marginTop: 8 }}>Opening Unity game...</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {error && (
            <Text style={{ color: "#ff6b6b", marginBottom: 12, fontSize: 12 }}>
              Error: {error}
            </Text>
          )}

          <View style={{ marginBottom: 8 }}>
            <Button title="Open Unity Game" onPress={openDeepLink} color={theme.colors.primary} />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Button title="Retry" onPress={openDeepLink} />
          </View>

          <View style={{ marginBottom: 8 }}>
            <Button title="Copy Deep Link" onPress={onCopyLink} />
          </View>

          <Text style={{ color: theme.colors.secondary, marginTop: 12, fontSize: 11 }} selectable>
            Deep Link: {deepLink}
            {"\n"}Package: {androidPackage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    marginBottom: 12,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  actions: {
    marginTop: 8,
  },
});