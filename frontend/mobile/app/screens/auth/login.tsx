import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { TextInput, Button } from "react-native-paper";
import { loginUser, handleGoogleSignInShared } from "../../../utils/auth";
import { useUser } from "../../context/UserContext";
import { tokenStorage } from "@/utils/tokenStorage";
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Email validation helper
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Google Sign-In Handler (shared)
  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await handleGoogleSignInShared({ 
        setLoading, 
        router,
        onSuccess: async (response) => {
          if (response?.data?.token) {
              // Save token and stored user first to avoid race where Analysis mounts before token is written
              await tokenStorage.saveToken(response.data.token);
              await tokenStorage.saveRefreshToken(response.data.refreshToken);
            await tokenStorage.saveUser(response.data.user);
              setUser(response.data.user); // Save user globally
              console.log("User: ", response.data.user);
              console.log("Token: ", response.data.token);
              console.log("Refresh Token: ", response.data.refreshToken);
              router.replace("../../(tabs)/Home");
            }
        },
        onError: (error) => {
          setError("Google Sign-In failed. Try again.");
        }
      });
    } catch (error) {
      setError("Google Sign-In failed. Try again.");
    }
  };

  const handleLogin = async () => {
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      const response = await loginUser(email, password);
      if (response.data.token) {
        // Save token and stored user first to avoid race where Analysis mounts before token is written
        await tokenStorage.saveToken(response.data.token);
        await tokenStorage.saveUser(response.data.user);
        setUser(response.data.user);
        router.replace("../../(tabs)/Home");
      } else {
        setError("Invalid email or password.");
      }
    } catch (error: any) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: theme.colors.background }}>
      <View className="w-full max-w-md rounded-3xl p-8" style={{ backgroundColor: theme.colors.background }}>
        <Text className="mb-2 text-center" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes["2xl"] }}>Sign In</Text>
        
        <View className="w-full">
          <TextInput
            label="Email"
            mode="outlined"
            textColor={theme.colors.text}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("email")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            placeholder="Enter your email"
            placeholderTextColor="white"
          />
          <TextInput
            label="Password"
            mode="outlined"
            textColor={theme.colors.text}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={{ marginBottom: 12, backgroundColor: theme.colors.input }}
            error={!!error && error.toLowerCase().includes("password")}
            theme={{ colors: { onSurfaceVariant: theme.colors.text + "EE", primary: theme.colors.primary } }}
            placeholder="Enter your password"
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword((prev) => !prev)}
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
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
          >
            Sign In
          </Button>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
            <Text className="mx-4" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base }}>OR</Text>
            <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
          </View>

          <Button
            mode="outlined"
            icon={() => (
              <Image source={require("../../../assets/images/google-logo.png")} style={{ width: 24, height: 24, marginRight: 8 }} />
            )}
            style={{ borderRadius: 12, borderColor: theme.colors.secondary + "22", marginBottom: 8 }}
            labelStyle={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            Continue with Google
          </Button>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity onPress={() => router.push("./register")}>
              <Text style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>
                Create an account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
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