import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function LoginScreen() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, {
        email,
        password,
      });
      Alert.alert("Login Successful", response.data.message);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",         
        error.response?.data?.message || "Unknown error"
      );
    }
  }

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-2xl">Username/Email</Text>
        <TextInput className="border w-3/4 p-2 my-4" placeholder="Enter your username or email" value={email} onChangeText={setEmail} />
      <Text className="text-2xl">Password</Text>
        <TextInput className="border w-3/4 p-2 my-4" placeholder="Enter your password" secureTextEntry value={password} onChangeText={setPassword}/>
      
      <TouchableOpacity className="bg-gray-500 px-8 py-3 rounded-full mt-4" onPress={handleLogin}>
        <Text className="text-white text-lg">Log In</Text>
      </TouchableOpacity>
        
        <Text className="text-2l m-2">OR</Text>

      <TouchableOpacity className="bg-blue-500 px-8 py-3 rounded-full">
        <Text className="text-white text-lg">Sign in with Google</Text>  
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.push("./register")}>
        <Text className="text-blue-500">Create an account</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4">
        <Text className="text-blue-500">Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}