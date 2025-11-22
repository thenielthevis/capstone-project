import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";

export default function GuestScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: "location-outline", title: "Smart Tracking", subtitle: "GPS-powered activity monitoring" },
    { icon: "analytics-outline", title: "AI Insights", subtitle: "Personalized health analytics" },
    { icon: "person-outline", title: "Virtual Avatar", subtitle: "Your digital wellness companion" },
    { icon: "camera-outline", title: "Smart Recognition", subtitle: "Automatic food & activity logging" },
    { icon: "people-outline", title: "Community", subtitle: "Connect & achieve together" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Main Content */}
      <View className="flex-1 justify-center px-6 pt-16">
        {/* Hero Text */}
        <View className="items-center mb-12">
          <Image
            source={require("../../../assets/images/logo.png")}
            className="w-24 h-24 mb-6"
            resizeMode="contain"
          />
          <Text
            className="text-4xl text-center mb-6 tracking-wider"
            style={{
              color: theme.colors.primary,
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes["2xl"],
            }}
          >
            LIFORA
          </Text>
          <Text
            className="text-lg text-center leading-relaxed px-4"
            style={{
              color: theme.colors.text + "B3",
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.base,
            }}
          >
            AI-powered insights meet community support for your perfect wellness journey
          </Text>
        </View>

        {/* Rotating Feature Display */}
        <View className="items-center mb-12">
          <View
            className="rounded-2xl p-8 w-full border"
            style={{
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.secondary + "33",
            }}
          >
            <View className="items-center">
              <View
                className="rounded-full p-4 mb-4"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <Ionicons
                  name={features[currentFeature].icon as any}
                  size={32}
                  color={theme.mode === "dark" ? theme.colors.background : "#fff"}
                />
              </View>
              <Text
                className="text-xl text-center mb-2"
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.subheading,
                  fontSize: theme.fontSizes.lg,
                }}
              >
                {features[currentFeature].title}
              </Text>
              <Text
                className="text-base text-center"
                style={{
                  color: theme.colors.text + "B3",
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.m,
                }}
              >
                {features[currentFeature].subtitle}
              </Text>
            </View>
          </View>

          {/* Feature Dots */}
          <View className="flex-row mt-6 justify-center">
            {features.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCurrentFeature(index)}
                activeOpacity={0.7}
                style={{
                  marginHorizontal: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  backgroundColor:
                    index === currentFeature
                      ? theme.colors.primary
                      : theme.colors.secondary + "55",
                }}
              />
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View
          className="rounded-2xl p-6 mb-12 border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.secondary + "33",
          }}
        >
          <View className="flex-row justify-around">
            {[
              { value: "50K+", label: "Users" },
              { value: "98%", label: "Success" },
              { value: "4.9★", label: "Rating" },
            ].map((stat, index) => (
              <View key={index} className="items-center">
                <Text
                  className="text-2xl"
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xl,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  className="text-sm"
                  style={{
                    color: theme.colors.text + "B3",
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className="px-6 pb-12 pt-4">
        <TouchableOpacity
          className="rounded-2xl py-5 mb-4"
          activeOpacity={0.9}
          onPress={() => router.push("/screens/auth/login")}
          style={{
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            className="text-lg font-semibold text-center"
            style={{
              color: '#FFFFFF',
              fontFamily: theme.fonts.heading,
              fontSize: theme.fontSizes.lg,
            }}
          >
            Start Your Journey Free
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center">
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={theme.colors.accent}
          />
          <Text
            className="text-sm ml-2"
            style={{
              color: theme.colors.secondary,
              fontFamily: theme.fonts.interRegular,
              fontSize: theme.fontSizes.sm,
            }}
          >
            No credit card required • Join 50,000+ users
          </Text>
        </View>
      </View>
    </View>
  );
}
