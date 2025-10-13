import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import { registerUser, handleGoogleSignInShared } from "../../../utils/auth";
import { useTheme } from "../../context/ThemeContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: theme.colors.background }}>
      <View className="w-full max-w-md rounded-3xl p-8" style={{ backgroundColor: theme.colors.background }}>
        <Text className="mb-2 text-center" style={{ color: theme.colors.primary, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes["2xl"] }}>Sign Up</Text>

        <TouchableOpacity 
          className="w-full py-4 rounded-xl flex-row justify-center items-center mb-6"
          style={{ backgroundColor: theme.colors.secondary + "22" }}
          onPress={handleGoogleSignIn}
        >
          <Image 
              source={require("../../../assets/images/google-logo.png")} 
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
          <Text className="font-semibold text-center" style={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
          <Text className="mx-4" style={{ color: theme.colors.secondary, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.base }}>OR</Text>
          <View className="flex-1 h-px" style={{ backgroundColor: theme.colors.secondary + "33" }} />
        </View>

        <View className="w-full">
          <Text style={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}>Username</Text>
          <TextInput
            className="w-full p-4 rounded-xl border-2 mt-1 mb-3"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.secondary + "33",
              color: theme.colors.text,
              fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m
            }}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
            placeholderTextColor={theme.colors.secondary + "99"}
          />

          <Text className="mt-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}>Email</Text>
          <TextInput
            className="w-full p-4 rounded-xl border-2 mt-1 mb-3"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.secondary + "33",
              color: theme.colors.text,
              fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m
            }}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={theme.colors.secondary + "99"}
          />

          <Text className="mt-2" style={{ color: theme.colors.text, fontFamily: theme.fonts.subheading, fontSize: theme.fontSizes.base }}>Password</Text>
          <TextInput
            className="w-full p-4 rounded-xl border-2 mt-1 mb-3"
            style={{
              backgroundColor: theme.colors.input,
              borderColor: theme.colors.secondary + "33",
              color: theme.colors.text,
              fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m
            }}
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={theme.colors.secondary + "99"}
          />

          <TouchableOpacity
            className="w-full py-4 rounded-xl mt-6"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleRegister}
          >
            <Text className="text-center" style={{ color: theme.colors.background, fontFamily: theme.fonts.heading, fontSize: theme.fontSizes.lg }}>
              Create Account
            </Text>
          </TouchableOpacity>

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