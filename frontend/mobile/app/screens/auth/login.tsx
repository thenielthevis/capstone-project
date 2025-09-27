import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import { loginUser, handleGoogleSignInShared } from "../../../utils/auth";
import { useTheme } from "../../context/ThemeContext";

export default function LoginScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
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
    <View className={`flex-1 justify-center items-center ${isDarkMode ? 'bg-background-dark' : 'bg-background-light'} px-6`}>
      <View className={`w-full max-w-sm ${isDarkMode ? 'bg-background-dark' : 'bg-background-light'} p-8 rounded-3xl shadow-lg`}>
        <Text className={`text-3xl font-bold ${isDarkMode ? 'text-customBlue-500-dark' : 'text-customBlue-500-light'} mb-6 text-center`}>Sign In</Text>
        
        <View className="space-y-4 w-full">
          <Text className={`text-lg font-semibold ${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'}`}>Email</Text>
          <TextInput
            className={`w-full p-4 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-customBlue-50-dark border-customBlue-100-dark text-text-dark' 
                : 'bg-customBlue-50-light border-customBlue-100-light text-text-light'
            }`}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={isDarkMode ? '#64748B' : '#8AAEE0'}
          />
          
          <Text className={`text-lg font-semibold mt-2 ${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'}`}>Password</Text>
          <TextInput
            className={`w-full p-4 rounded-xl border-2 ${
              isDarkMode 
                ? 'bg-customBlue-50-dark border-customBlue-100-dark text-text-dark' 
                : 'bg-customBlue-50-light border-customBlue-100-light text-text-light'
            }`}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={isDarkMode ? '#64748B' : '#8AAEE0'}
          />

          <TouchableOpacity
            className={`${isDarkMode ? 'bg-primary-dark' : 'bg-primary-light'} w-full py-4 rounded-xl mt-6`}
            onPress={handleLogin}
          >
            <Text className={`${isDarkMode ? 'text-background-dark' : 'text-background-light'} text-lg font-semibold text-center`}>
              Log In
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className={`flex-1 h-0.5 ${isDarkMode ? 'bg-customBlue-100-dark' : 'bg-customBlue-100-light'}`} />
            <Text className={`mx-4 font-medium ${isDarkMode ? 'text-customBlue-300-dark' : 'text-customBlue-300-light'}`}>OR</Text>
            <View className={`flex-1 h-0.5 ${isDarkMode ? 'bg-customBlue-100-dark' : 'bg-customBlue-100-light'}`} />
          </View>

          <TouchableOpacity 
            className={`${isDarkMode ? 'bg-customBlue-100-dark' : 'bg-customBlue-100-light'} w-full py-4 rounded-xl flex-row justify-center items-center`}
            onPress={handleGoogleSignIn}
          >
            <Image 
              source={require("../../../assets/images/google-logo.png")} 
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <Text className={`${isDarkMode ? 'text-customBlue-500-dark' : 'text-customBlue-500-light'} text-lg font-semibold text-center`}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity onPress={() => router.push("./register")}>
              <Text className={`font-medium ${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'}`}>
                Create an account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className={`font-medium ${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'}`}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading && (
        <View className={`absolute inset-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/40'} justify-center items-center`}>
          <ActivityIndicator size="large" color={isDarkMode ? '#1a90ff' : '#38b6ff'} />
          <Text className="text-white mt-2">Please wait...</Text>
        </View>
      )}
    </View>
  );
}