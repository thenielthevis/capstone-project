import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { registerUser, handleGoogleSignInShared } from "../../../utils/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Google Sign-In Handler (shared)
  const handleGoogleSignIn = () =>
    handleGoogleSignInShared({ setLoading, router });

  // Normal registration
  const handleRegister = async () => {
    try {
      setLoading(true);
      await registerUser(username, email, password);
      await auth().createUserWithEmailAndPassword(email, password);
      console.log("Firebase email/password sign-up successful");
    } catch (err: any) {
      console.log("Registration Failed", err);
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
          <Text className="text-4xl font-bold text-base-content mb-2">Join Lifora</Text>
          <Text className="text-lg text-base-content/60 text-center">
            Transform your wellness journey today
          </Text>
        </View>

        {/* Google Sign-Up Button */}
        <TouchableOpacity
          className="btn btn-outline w-full mb-6"
          onPress={handleGoogleSignIn}
        >
          <View className="w-6 h-6 bg-red-500 rounded-full mr-3" />
          <Text className="text-base-content text-lg font-medium">Sign up with Google</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View className="divider">OR</View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-base-content text-lg font-medium mb-2">Username</Text>
            <TextInput
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/60"
              placeholder="Enter your username"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View>
            <Text className="text-base-content text-lg font-medium mb-2">Email</Text>
            <TextInput
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/60"
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
              className="input input-bordered w-full bg-base-100 text-base-content placeholder:text-base-content/60"
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity
          className="btn btn-primary w-full mt-8"
          onPress={handleRegister}
        >
          <Text className="text-white text-lg font-bold text-center">Create Account</Text>
        </TouchableOpacity>

        {/* Login Link */}
        <TouchableOpacity className="mt-6 items-center" onPress={() => router.push("./login")}>
          <Text className="text-primary text-lg">
            Already have an account? <Text className="font-bold">Sign In</Text>
          </Text>
        </TouchableOpacity>

        {/* Loading Overlay */}
        {loading && (
          <View className="absolute inset-0 bg-black/40 justify-center items-center">
            <View className="card bg-base-100 p-8 items-center shadow-2xl">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-base-content mt-4 text-lg font-medium">
                Creating your account...
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
