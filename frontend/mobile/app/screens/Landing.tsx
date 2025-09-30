import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Landing() {
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    // Mobile implementation - could be used with a scroll view ref
    console.log(`Scrolling to ${sectionId}`);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white/80 shadow-lg border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity className="flex-row items-center" onPress={() => scrollToSection('home')}>
          <View className="w-10 h-10 bg-blue-500 rounded-full mr-3 items-center justify-center">
            <Text className="text-white font-bold text-lg">L</Text>
          </View>
          <Text className="text-2xl font-bold text-blue-600">Lifora</Text>
        </TouchableOpacity>
        <View className="flex-row gap-2">
          <TouchableOpacity 
            className="px-4 py-2 border border-blue-500 rounded-full"
            onPress={() => router.push('./auth/login')}
          >
            <Text className="text-blue-500 font-medium">Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="px-4 py-2 bg-blue-500 rounded-full"
            onPress={() => router.push('./auth/register')}
          >
            <Text className="text-white font-medium">Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Home Section */}
      <View className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 justify-center items-center px-4">
        <View className="max-w-4xl items-center">
          <Text className="text-4xl font-bold mb-6 text-gray-800 text-center">
            Gamifying Wellness: Track, Assess, and Thrive Every Day
          </Text>
          <Text className="text-lg mb-8 text-gray-700 text-center">
            Lifora uses AI to provide predictive health insights and preventive wellness solutions, 
            helping you stay ahead of potential health risks and optimize your well-being.
          </Text>
          <TouchableOpacity className="bg-blue-500 px-8 py-4 rounded-full shadow-lg">
            <Text className="text-white text-lg font-bold">JOIN NOW!</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-20 bg-gray-100">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-gray-800">Transform Your Health Journey</Text>
            <Text className="text-lg text-gray-600 text-center">
              Experience a revolutionary approach to wellness with our cutting-edge features designed to make your health journey engaging and effective.
            </Text>
          </View>
          <View className="gap-8">
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-full h-48 bg-gray-200 rounded-xl mb-4"></View>
              <Text className="text-xl font-bold text-blue-600 text-center mb-2">Gamified</Text>
              <Text className="text-gray-600 text-center">Engage in a fun, interactive experience that turns health goals into rewarding challenges.</Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-full h-48 bg-gray-200 rounded-xl mb-4"></View>
              <Text className="text-xl font-bold text-blue-600 text-center mb-2">Nutritional Tracking</Text>
              <Text className="text-gray-600 text-center">Easily track your daily food intake and gain valuable insights into your nutrition.</Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-full h-48 bg-gray-200 rounded-xl mb-4"></View>
              <Text className="text-xl font-bold text-blue-600 text-center mb-2">Daily Assessment</Text>
              <Text className="text-gray-600 text-center">Receive personalized daily assessments to monitor your progress and identify health trends.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View className="py-20 bg-white">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-gray-800">About Lifora</Text>
            <Text className="text-lg text-gray-600 text-center">
              We are dedicated to transforming personal health by making wellness an engaging and insightful journey. 
              Our platform combines gamification, nutritional tracking, and daily assessments to empower you with the 
              knowledge and motivation to achieve your health goals.
            </Text>
          </View>
          <View className="gap-8">
            <View className="bg-gray-50 rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">⚡</Text>
              </View>
              <Text className="text-xl font-bold text-blue-600 text-center mb-2">Our Mission</Text>
              <Text className="text-gray-600 text-center">To provide accessible and comprehensive wellness solutions through innovative technology.</Text>
            </View>
            <View className="bg-gray-50 rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-purple-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">👁</Text>
              </View>
              <Text className="text-xl font-bold text-purple-600 text-center mb-2">Our Vision</Text>
              <Text className="text-gray-600 text-center">To revolutionize personal health management through engaging, technology-driven solutions.</Text>
            </View>
            <View className="bg-gray-50 rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">❤️</Text>
              </View>
              <Text className="text-xl font-bold text-green-600 text-center mb-2">Our Values</Text>
              <Text className="text-gray-600 text-center">Innovation, accessibility, and user empowerment drive our commitment.</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View className="py-20 bg-gray-100">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-gray-800">For Any Concerns or Inquiries</Text>
            <Text className="text-lg text-gray-600">
              Have questions or need assistance? Get in touch with us today!
            </Text>
          </View>
          <View className="gap-8">
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">📧</Text>
              </View>
              <Text className="text-xl font-bold text-blue-600 text-center mb-2">Email Us</Text>
              <Text className="text-gray-600 text-center">FutureProof@gmail.com</Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-purple-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">📞</Text>
              </View>
              <Text className="text-xl font-bold text-purple-600 text-center mb-2">Call Us</Text>
              <Text className="text-gray-600 text-center">+1 (800) 123-4567</Text>
            </View>
            <View className="bg-white rounded-xl shadow-lg p-6">
              <View className="w-16 h-16 bg-green-500 rounded-full items-center justify-center mx-auto mb-4">
                <Text className="text-white text-2xl">📍</Text>
              </View>
              <Text className="text-xl font-bold text-green-600 text-center mb-2">Visit Us</Text>
              <Text className="text-gray-600 text-center">123 Greenway Blvd, Suite 456</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
