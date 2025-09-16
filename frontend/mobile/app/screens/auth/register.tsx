import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
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
      const response = await registerUser(username, email, password);
      await auth().createUserWithEmailAndPassword(email, password);
      console.log("Firebase email/password sign-up successful");
    } catch (err: any) {
      console.log("Registration Failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity
        className="bg-blue-500 px-8 py-3 rounded-full"
        onPress={handleGoogleSignIn}
      >
        <Text className="text-white text-lg">Sign up with Google</Text>
      </TouchableOpacity>

      <Text className="text-2xl m-2">OR</Text>

      <Text className="text-2xl">Username</Text>
      <TextInput
        className="border w-3/4 p-2 my-4"
        placeholder="Enter your username"
        value={username}
        onChangeText={setUsername}
      />

      <Text className="text-2xl">Email</Text>
      <TextInput
        className="border w-3/4 p-2 my-4"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
      />

      <Text className="text-2xl">Password</Text>
      <TextInput
        className="border w-3/4 p-2 my-4"
        placeholder="Enter your password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="bg-gray-500 px-8 py-3 rounded-full mt-4"
        onPress={handleRegister}
      >
        <Text className="text-white text-lg">Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.push("./login")}>
        <Text className="text-blue-500">Already have an account?</Text>
      </TouchableOpacity>

      {loading && (
        <View className="absolute inset-0 bg-black/40 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-2">Please wait...</Text>
        </View>
      )}
    </View>
  );
}
