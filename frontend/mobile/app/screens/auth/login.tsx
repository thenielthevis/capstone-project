import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
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
      const response = await loginUser(email, password);
      console.log("[LoginScreen] Login response:", response.data);
    } catch (error: any) {
      console.log("Login Error:", error);
    }
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl">Email</Text>
      <TextInput
        className="border w-3/4 p-2 my-4"
        placeholder="Enter your username or email"
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
        style={{ color: 'black' }}
      />

      <TouchableOpacity
        className="bg-gray-500 px-8 py-3 rounded-full mt-4"
        onPress={handleLogin}
      >
        <Text className="text-white text-lg">Log In</Text>
      </TouchableOpacity>

      <Text className="text-2l m-2">OR</Text>

      <TouchableOpacity className="bg-blue-500 px-8 py-3 rounded-full" onPress={handleGoogleSignIn}>
        <Text className="text-white text-lg">Sign in with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.push("./register")}>
        <Text className="text-blue-500">Create an account</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4">
        <Text className="text-blue-500">Forgot Password?</Text>
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