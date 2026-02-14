import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { tokenStorage } from "@/utils/tokenStorage";
import { registerUser, handleGoogleSignInShared } from "../../../utils/auth";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { TextInput, Button, IconButton } from "react-native-paper";
import { executePendingNavigation } from "../../services/notificationRouter";

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setUser, user } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = async () => {
      const token = await tokenStorage.getToken();
      if (token && user) {
        router.replace('../../(tabs)/Home');
      }
    };
    checkAuth();
  }, [user, router]);

  // Email validation helper
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Google Sign-In Handler (shared)
  const handleGoogleSignIn = () =>
    handleGoogleSignInShared({
      setLoading,
      router,
      onSuccess: async (response) => {
        if (response?.data?.user) {
          setUser(response.data.user); // Save user globally
          await tokenStorage.saveToken(response.data.token);
          await tokenStorage.saveUser(response.data.user);
          
          // Check for pending notification navigation (e.g., user tapped notification before logging in)
          const hasPendingNav = await executePendingNavigation(router);
          if (!hasPendingNav) {
            router.replace("../../(tabs)/Home");
          }
        }
      },
      onError: (error) => {
        setError("Google Sign-In failed. Try again.");
      },
    });

  // Normal registration
  const handleRegister = async () => {
    setError(null);
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      setLoading(true);
      await registerUser(username, email, password);
      router.replace("./login");
    } catch (err: any) {
      setError("Registration failed. Please try again.");
      console.log("Registration Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: theme.colors.background }}>
      <View className="w-full max-w-md rounded-3xl p-8" style={{ backgroundColor: theme.colors.background }}>
        <Text className="mb-2 text-center" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes["2xl"] }}>Sign Up</Text>

        <Button
          mode="outlined"
          icon={() => (
            <Image
              source={require("../../../assets/images/google-logo.png")}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
          )}
          style={{ borderRadius: 12, borderColor: theme.colors.secondary + "22", marginBottom: 8 }}
          labelStyle={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
          <Text className="mx-4" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base }}>OR</Text>
          <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
        </View>

        <View className="w-full">
          <TextInput
            label="Username"
            mode="outlined"
            value={username}
            onChangeText={setUsername}
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("username")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            autoCapitalize="none"
            textColor={theme.colors.text}
            placeholder="Enter your username"
            right={undefined}
          />
          <TextInput
            label="Email"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("email")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            textColor={theme.colors.text}
            placeholder="Enter your email"
            right={undefined}
          />
          <TextInput
            label="Password"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("password")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            textColor={theme.colors.text}
            placeholder="Enter your password"
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((prev) => !prev)}
                forceTextInputFocus={false}
              />
            }
          />
          <TextInput
            label="Confirm Password"
            mode="outlined"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("match")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            textColor={theme.colors.text}
            placeholder="Re-enter your password"
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                forceTextInputFocus={false}
              />
            }
          />

          {error && (
            <Text style={{ color: "red", marginBottom: 8, fontFamily: theme.fonts.body }}>{error}</Text>
          )}

          <Button
            mode="contained"
            style={{ marginTop: 8, borderRadius: 12, backgroundColor: theme.colors.primary }}
            labelStyle={{ color: '#FFFFFF', fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg }}
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
          >
            Create Account
          </Button>

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.replace("./login")}
          >
            <Text style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>
              Already have an account?
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View className="absolute left-0 right-0 top-0 bottom-0 justify-center items-center" style={{ backgroundColor: theme.colors.overlay }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text className="mt-2" style={{ color: "#fff" }}>Please wait...</Text>
        </View>
      )}
    </View>
  );
}