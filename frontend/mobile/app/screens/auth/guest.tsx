import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GuestScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentFeature, setCurrentFeature] = useState(0);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  const features = [
    {
      icon: "fitness-outline",
      title: "Smart Tracking",
      color: "#38b6ff"
    },
    {
      icon: "sparkles-outline",
      title: "AI Analysis",
      color: "#8b5cf6"
    },
    {
      icon: "body-outline",
      title: "Digital Avatar",
      color: "#f59e0b"
    },
    {
      icon: "camera-outline",
      title: "Food Scanner",
      color: "#10b981"
    },
    {
      icon: "people-outline",
      title: "Community",
      color: "#ec4899"
    },
  ];

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Feature rotation
    const interval = setInterval(() => {
      Animated.timing(featureAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
        Animated.timing(featureAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 2500);

    Animated.timing(featureAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    return () => clearInterval(interval);
  }, []);

  const isDark = theme.mode === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />

      {/* Main Content */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>

        {/* Logo & Brand */}
        <Animated.View
          style={{
            alignItems: "center",
            opacity: fadeAnim,
            transform: [{ scale: logoScale }],
          }}
        >
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: theme.colors.primary + "12",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Image
              source={require("../../../assets/images/logo.png")}
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
            />
          </View>

          <Text
            style={{
              fontSize: 32,
              letterSpacing: 8,
              color: theme.colors.text,
              fontFamily: theme.fonts.heading,
              marginBottom: 12,
            }}
          >
            LIFORA
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text + "60",
              fontFamily: theme.fonts.body,
              letterSpacing: 1,
            }}
          >
            Your wellness companion
          </Text>
        </Animated.View>

        {/* Animated Feature Pills */}
        <Animated.View
          style={{
            marginTop: 48,
            opacity: slideAnim.interpolate({
              inputRange: [0, 40],
              outputRange: [1, 0],
            }),
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {features.map((feature, index) => (
              <Animated.View
                key={index}
                style={{
                  opacity: index === currentFeature ? 1 : 0.4,
                  transform: [{
                    scale: index === currentFeature ? 1 : 0.95,
                  }],
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 20,
                    backgroundColor: index === currentFeature
                      ? feature.color + "18"
                      : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: index === currentFeature
                      ? feature.color + "30"
                      : "transparent",
                  }}
                >
                  <Ionicons
                    name={feature.icon as any}
                    size={16}
                    color={index === currentFeature ? feature.color : theme.colors.text + "50"}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 13,
                      color: index === currentFeature ? feature.color : theme.colors.text + "50",
                      fontFamily: theme.fonts.body,
                      fontWeight: index === currentFeature ? "600" : "400",
                    }}
                  >
                    {feature.title}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Bottom CTA */}
      <Animated.View
        style={{
          paddingHorizontal: 24,
          paddingBottom: 50,
          opacity: buttonAnim,
          transform: [{
            translateY: buttonAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/screens/auth/features")}
          style={{
            borderRadius: 14,
            overflow: "hidden",
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <LinearGradient
            colors={[theme.colors.primary, "#0891b2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: "#FFFFFF",
                fontFamily: theme.fonts.heading,
                marginRight: 8,
              }}
            >
              Get Started
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push("/screens/auth/login")}
          style={{ marginTop: 16, alignItems: "center" }}
        >
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.text + "70",
              fontFamily: theme.fonts.body,
            }}
          >
            Already have an account? <Text style={{ color: theme.colors.primary, fontWeight: "600" }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
