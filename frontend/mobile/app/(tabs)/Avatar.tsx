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
        console.log("[Avatar] Attempting to open Unity game with deep link scheme:", finalDeepLink);

        try {
          // Check if system can handle this intent first (works because of our Android 11 <queries> plugin)
          const canOpen = await Linking.canOpenURL(finalDeepLink);

          if (canOpen) {
            await Linking.openURL(finalDeepLink);
            console.log("[Avatar] Successfully opened Unity game.");
            setLoading(false);
            return;
          } else {
            console.warn("[Avatar] System reports it cannot open URL. Attempting forced fallback via openURL.");
            // If the user's OS doesn't support canOpenURL properly, sometimes a forced attempt still succeeds.
            await Linking.openURL(finalDeepLink);
            setLoading(false);
            return;
          }
        } catch (e: any) {
          console.warn("[Avatar] Failed to open scheme URL:", e?.message ?? e);

          // As a last-resort fallback for Android, try an Intent URI (standard ACTION_VIEW)
          try {
            const scheme = "liforacc";
            const host = "liforagamecc";
            const params = `scene=Main&token=${encodeURIComponent(token || "")}&apiUrl=${encodeURIComponent(apiUrl)}`;

            const intentUri = `intent://${host}?${params}#Intent;action=android.intent.action.VIEW;scheme=${scheme};package=${androidPackage};end`;
            console.log("[Avatar] Attempting Intent URI fallback:", intentUri);

            await Linking.openURL(intentUri);
            setLoading(false);
            return;
          } catch (intentErr) {
            console.warn("[Avatar] Intent URI fallback failed.");
          }
        }
      } else {
        console.log("[Avatar] Non-Android platform, skipping deep link");
      }

      // If all attempts fail, show error state and alert
      const errorMsg = `Unable to open Unity game via deep link from React Native. The app might not be installed or the intent failed to resolve.`;
      setError(errorMsg);
      console.error("[Avatar]", errorMsg);

      Alert.alert(
        "Cannot Open Game",
        `Ensure that the game is installed.\n\nIf running in dev mode, adb command:\nadb shell am start -a android.intent.action.VIEW -d "${finalDeepLink}"`,
        [
          { text: "OK" },
          { text: "Retry", onPress: openDeepLink },
          { text: "Copy Dev Linking Command", onPress: () => onCopyLink() }
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