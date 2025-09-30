import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { loginUser, handleGoogleSignInShared } from "../../../utils/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Sign-In Handler (shared)
  const handleGoogleSignIn = () =>
    handleGoogleSignInShared({ setLoading, router });

  const handleLogin = async () => {
    try {
      setLoading(true);
      const response = await loginUser(email, password);
      console.log("[LoginScreen] Login response:", response.data);
    } catch (error: any) {
      console.log("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-base-200 to-base-300" data-theme="light">
      <View className="flex-1 justify-center px-8 py-12">
        {/* Header */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4 shadow-lg">
            <Text className="text-white font-bold text-3xl">L</Text>
          </View>
          <Text className="text-4xl font-bold text-base-content mb-2">Welcome Back</Text>
          <Text className="text-lg text-base-content/60 text-center">Continue your wellness journey</Text>
        </View>

        {/* Form */}
        <View className="space-y-4 mb-8">
          <View>
            <Text className="text-base-content text-lg font-medium mb-2">Email</Text>
            <TextInput
              className="input input-bordered w-full bg-base-100 text-base-content rounded-xl px-4 py-4 shadow-sm"
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-base-content text-lg font-medium mb-2">Password</Text>
            <TextInput
              className="input input-bordered w-full bg-base-100 text-base-content rounded-xl px-4 py-4 shadow-sm"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          className="btn btn-primary w-full mb-6"
          onPress={handleLogin}
        >
          <Text className="text-white text-lg font-bold text-center">Log In</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="divider">OR</View>

        {/* Google Sign-In Button */}
        <TouchableOpacity 
          className="btn btn-outline w-full mb-6"
          onPress={handleGoogleSignIn}
        >
          <View className="w-6 h-6 bg-red-500 rounded-full mr-3"></View>
          <Text className="text-base-content text-lg font-medium">Sign in with Google</Text>
        </TouchableOpacity>

        {/* Links */}
        <View className="items-center space-y-4">
          <TouchableOpacity onPress={() => router.push("./register")}>
            <Text className="text-primary text-lg">Don't have an account? <Text className="font-bold">Sign Up</Text></Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text className="text-primary text-lg font-medium">Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Overlay */}
        {loading && (
          <View className="absolute inset-0 bg-black/40 justify-center items-center">
            <View className="card bg-base-100 p-8 items-center shadow-2xl">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-base-content mt-4 text-lg font-medium">Signing you in...</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}