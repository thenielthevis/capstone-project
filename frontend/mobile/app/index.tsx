import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function LandingScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-4xl font-bold mb-8 text-blue-600">Welcome</Text>
      <TouchableOpacity
        className="bg-blue-500 px-8 py-3 rounded-full mb-4"
        onPress={() => router.push("/screens/auth/login")}
      >
        <Text className="text-white text-lg">Join us for free!</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-gray-200 px-8 py-3 rounded-full"
        onPress={() => router.push("/screens/auth/register")}
      >
        <Text className="text-blue-500 text-lg">Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}