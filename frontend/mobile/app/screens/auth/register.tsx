import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

export default function RegisterScreen() {
  const router = useRouter();
  const API_URL = process.env.EXPO_PUBLIC_API_URL;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/users/register`, {
        username,
        email,
        password,
      });
        Alert.alert("Registration Successful", response.data.message);
      } catch (error: any) {
        Alert.alert(
          "Registration Failed",
          error.response?.data?.message || "Unknown error"
        );
      }
    }

  return (
    <View className="flex-1 justify-center items-center">
      <TouchableOpacity className="bg-blue-500 px-8 py-3 rounded-full">
        <Text className="text-white text-lg">Sign up with Google</Text>  
      </TouchableOpacity>

        <Text className="text-2l m-2">OR</Text>

      <Text className="text-2xl">Username</Text>
        <TextInput className="border w-3/4 p-2 my-4" placeholder="Enter your username" value={username} onChangeText={setUsername} />
      <Text className="text-2xl">Email</Text>
        <TextInput className="border w-3/4 p-2 my-4" placeholder="Enter your username or email" value={email} onChangeText={setEmail} /> 
      <Text className="text-2xl">Password</Text>
        <TextInput className="border w-3/4 p-2 my-4" placeholder="Enter your password" secureTextEntry value={password} onChangeText={setPassword}/>
      
      <TouchableOpacity className="bg-gray-500 px-8 py-3 rounded-full mt-4" onPress={handleRegister}>
        <Text className="text-white text-lg">Create an Account</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.push("./login")}>
        <Text className="text-blue-500">Already have an account?</Text>
      </TouchableOpacity>
    </View>
  );
}