import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { getThemeClass, themeStyles } from './utils/theme';

const { width, height } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: 'location-outline' as const, title: "Smart Tracking", subtitle: "GPS-powered activity monitoring" },
    { icon: 'analytics-outline' as const, title: "AI Insights", subtitle: "Personalized health analytics" },
    { icon: 'person-outline' as const, title: "Virtual Avatar", subtitle: "Your digital wellness companion" },
    { icon: 'camera-outline' as const, title: "Smart Recognition", subtitle: "Automatic food & activity logging" },
    { icon: 'people-outline' as const, title: "Community", subtitle: "Connect & achieve together" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-background-dark' : 'bg-background-light'}`}>
      {/* Theme Toggle */}
      <TouchableOpacity 
        className="absolute top-12 right-6 z-10 p-2"
        onPress={toggleTheme}
      >
        <Ionicons 
          name={isDarkMode ? "sunny-outline" : "moon-outline"} 
          size={24} 
          color={isDarkMode ? "#F3F4F6" : "#1a1916"}
        />
      </TouchableOpacity>

      {/* Main Content */}
      <View className="flex-1 justify-center px-6 pt-16">
        {/* Hero Text */}
        <View className="items-center mb-12">
          <Image 
            source={require('../assets/images/logo.png')} 
            className="w-24 h-24 mb-6"
            resizeMode="contain"
          />
          <Text className={`${getThemeClass(isDarkMode, themeStyles.text.primary)} ${themeStyles.font.heading} text-4xl text-center mb-6 tracking-wider`}>
            LIFORA
          </Text>
          <Text className={`${getThemeClass(isDarkMode, themeStyles.text.secondary)} ${themeStyles.font.body} text-lg text-center leading-relaxed px-4`}>
            AI-powered insights meet community support for your perfect wellness journey
          </Text>
        </View>

        {/* Rotating Feature Display */}
        <View className="items-center mb-12">
          <View className={`${isDarkMode ? 'bg-customBlue-50-dark' : 'bg-customBlue-50-light'} rounded-2xl p-8 w-full border ${isDarkMode ? 'border-customBlue-100-dark' : 'border-customBlue-100-light'}`}>
            <View className="items-center">
              <View className={`${isDarkMode ? 'bg-primary-dark' : 'bg-primary-light'} rounded-full p-4 mb-4`}>
                <Ionicons 
                  name={features[currentFeature].icon} 
                  size={32} 
                  color={isDarkMode ? "#111827" : "white"}
                />
              </View>
              <Text className={`${isDarkMode ? 'text-text-dark' : 'text-text-light'} text-xl font-bold mb-2 text-center`}>
                {features[currentFeature].title}
              </Text>
              <Text className={`${isDarkMode ? 'text-secondary-dark' : 'text-secondary-light'} text-base text-center`}>
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
                style={{ marginHorizontal: 4 }}
              >
                <View 
                  className={`w-2 h-2 rounded-full ${
                    index === currentFeature ? 'bg-primary' : 'bg-customBlue-200'
                  }`} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View className={`bg-gradient-to-r ${isDarkMode ? 'from-primary-dark/10 to-customBlue-100-dark/30' : 'from-primary-light/5 to-customBlue-100-light/30'} rounded-2xl p-6 mb-12 border ${isDarkMode ? 'border-customBlue-100-dark' : 'border-customBlue-100-light'}`}>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className={`${isDarkMode ? 'text-primary-dark' : 'text-primary-light'} text-2xl font-bold`}>50K+</Text>
              <Text className={`${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'} text-sm font-medium`}>Users</Text>
            </View>
            <View className="items-center">
              <Text className={`${isDarkMode ? 'text-accent-dark' : 'text-accent-light'} text-2xl font-bold`}>98%</Text>
              <Text className={`${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'} text-sm font-medium`}>Success</Text>
            </View>
            <View className="items-center">
              <Text className={`${isDarkMode ? 'text-secondary-dark' : 'text-secondary-light'} text-2xl font-bold`}>4.9★</Text>
              <Text className={`${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'} text-sm font-medium`}>Rating</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom CTA */}
      <View className={`px-6 pb-12 pt-4 bg-gradient-to-b ${isDarkMode ? 'from-background-dark to-customBlue-50-dark' : 'from-background-light to-customBlue-50-light'}`}>
        <TouchableOpacity
          className={`${isDarkMode ? 'bg-primary-dark' : 'bg-primary-light'} rounded-2xl py-5 mb-4`}
          onPress={() => router.push("/screens/auth/register")}
          activeOpacity={0.9}
          style={{
            shadowColor: isDarkMode ? '#1a90ff' : '#38b6ff',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 5
          }}
        >
          <Text className={`${isDarkMode ? 'text-background-dark' : 'text-background-light'} text-lg font-semibold text-center`}>
            Start Your Journey Free
          </Text>
        </TouchableOpacity>
        
        <View className="flex-row justify-center items-center">
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color={isDarkMode ? "#34d399" : "#10B981"} 
          />
          <Text className={`${isDarkMode ? 'text-customBlue-400-dark' : 'text-customBlue-400-light'} text-sm ml-2`}>
            No credit card required • Join 50,000+ users
          </Text>
        </View>
      </View>
    </View>
  );
}