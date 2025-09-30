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
    <ScrollView className="flex-1 bg-base-100" data-theme="light">
      {/* Header */}
      <View className="navbar bg-base-200/80 shadow-lg border-b border-base-300 px-4 py-3">
        <View className="navbar-start">
          <TouchableOpacity className="flex-row items-center" onPress={() => scrollToSection('home')}>
            <View className="w-10 h-10 bg-primary rounded-full mr-3 items-center justify-center">
              <Text className="text-white font-bold text-lg">L</Text>
            </View>
            <Text className="text-2xl font-bold text-primary">Lifora</Text>
          </TouchableOpacity>
        </View>
        <View className="navbar-end gap-2">
          <TouchableOpacity 
            className="btn btn-outline btn-primary"
            onPress={() => router.push('./screens/auth/login')}
          >
            <Text className="text-primary font-medium">Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="btn btn-primary"
            onPress={() => router.push('./screens/auth/register')}
          >
            <Text className="text-white font-medium">Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Home Section */}
      <View className="hero min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 justify-center items-center px-4">
        <View className="hero-content text-center max-w-4xl">
          <View>
            <Text className="text-4xl font-bold mb-6 text-base-content text-center">
              Gamifying Wellness: Track, Assess, and Thrive Every Day
            </Text>
            <Text className="text-lg mb-8 text-base-content/90 text-center">
              Lifora uses AI to provide predictive health insights and preventive wellness solutions, 
              helping you stay ahead of potential health risks and optimize your well-being.
            </Text>
            <TouchableOpacity 
              className="btn btn-primary btn-lg shadow-lg"
              onPress={() => router.push('./screens/auth/register')}
            >
              <Text className="text-white font-bold text-lg">JOIN NOW!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="py-20 bg-base-200/30">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-base-content text-center">Transform Your Health Journey</Text>
            <Text className="text-lg text-base-content/80 text-center">
              Experience a revolutionary approach to wellness with our cutting-edge features designed to make your health journey engaging and effective.
            </Text>
          </View>
          <View className="gap-8">
            <View className="card bg-base-100 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-full h-48 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl items-center justify-center">
                  <Text className="text-6xl">🎮</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-xl font-bold text-primary mb-2">Gamified</Text>
                <Text className="text-base-content/80 text-center">Engage in a fun, interactive experience that turns health goals into rewarding challenges.</Text>
              </View>
            </View>
            
            <View className="card bg-base-100 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-full h-48 bg-gradient-to-br from-accent/30 to-primary/30 rounded-xl items-center justify-center">
                  <Text className="text-6xl">🍎</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-xl font-bold text-primary mb-2">Nutritional Tracking</Text>
                <Text className="text-base-content/80 text-center">Easily track your daily food intake and gain valuable insights into your nutrition.</Text>
              </View>
            </View>
            
            <View className="card bg-base-100 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-full h-48 bg-gradient-to-br from-secondary/30 to-accent/30 rounded-xl items-center justify-center">
                  <Text className="text-6xl">📊</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-xl font-bold text-primary mb-2">Daily Assessment</Text>
                <Text className="text-base-content/80 text-center">Receive personalized daily assessments to monitor your progress and identify health trends.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View className="py-20 bg-base-100">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-base-content text-center">About Lifora</Text>
            <Text className="text-lg text-base-content/80 text-center">
              We are dedicated to transforming personal health by making wellness an engaging and insightful journey. 
              Our platform combines gamification, nutritional tracking, and daily assessments to empower you with the 
              knowledge and motivation to achieve your health goals.
            </Text>
          </View>
          <View className="gap-8">
            <View className="card bg-base-200/50 shadow-xl">
              <View className="card-body text-center">
                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mx-auto mb-4 shadow-lg">
                  <Text className="text-white text-2xl">⚡</Text>
                </View>
                <Text className="text-xl font-bold text-primary mb-2">Our Mission</Text>
                <Text className="text-base-content/80 text-center">To provide accessible and comprehensive wellness solutions through innovative technology.</Text>
              </View>
            </View>
            
            <View className="card bg-base-200/50 shadow-xl">
              <View className="card-body text-center">
                <View className="w-16 h-16 bg-secondary rounded-full items-center justify-center mx-auto mb-4 shadow-lg">
                  <Text className="text-white text-2xl">👁</Text>
                </View>
                <Text className="text-xl font-bold text-secondary mb-2">Our Vision</Text>
                <Text className="text-base-content/80 text-center">To revolutionize personal health management through engaging, technology-driven solutions.</Text>
              </View>
            </View>
            
            <View className="card bg-base-200/50 shadow-xl">
              <View className="card-body text-center">
                <View className="w-16 h-16 bg-accent rounded-full items-center justify-center mx-auto mb-4 shadow-lg">
                  <Text className="text-white text-2xl">❤️</Text>
                </View>
                <Text className="text-xl font-bold text-accent mb-2">Our Values</Text>
                <Text className="text-base-content/80 text-center">Innovation, accessibility, and user empowerment drive our commitment.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Contact Section */}
      <View className="py-20 bg-base-200/30">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-base-content text-center">For Any Concerns or Inquiries</Text>
            <Text className="text-lg text-base-content/80 text-center">
              Have questions or need assistance? Get in touch with us today!
            </Text>
          </View>
          <View className="gap-8">
            <View className="card bg-base-100 shadow-xl">
              <View className="card-body items-center text-center">
                <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4 shadow-lg">
                  <Text className="text-white text-2xl">📧</Text>
                </View>
                <Text className="text-xl font-bold text-primary mb-2">Email Us</Text>
                <Text className="text-base-content/80">FutureProof@gmail.com</Text>
              </View>
            </View>
            
            <View className="card bg-base-100 shadow-xl">
              <View className="card-body items-center text-center">
                <View className="w-16 h-16 bg-secondary rounded-full items-center justify-center mb-4 shadow-lg">
                  <Text className="text-white text-2xl">📞</Text>
                </View>
                <Text className="text-xl font-bold text-secondary mb-2">Call Us</Text>
                <Text className="text-base-content/80">+1 (800) 123-4567</Text>
              </View>
            </View>
            
            <View className="card bg-base-100 shadow-xl">
              <View className="card-body items-center text-center">
                <View className="w-16 h-16 bg-accent rounded-full items-center justify-center mb-4 shadow-lg">
                  <Text className="text-white text-2xl">📍</Text>
                </View>
                <Text className="text-xl font-bold text-accent mb-2">Visit Us</Text>
                <Text className="text-base-content/80">123 Greenway Blvd, Suite 456</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Team Section */}
      <View className="py-20 bg-base-100">
        <View className="px-4">
          <View className="text-center mb-16">
            <Text className="text-3xl font-bold mb-4 text-base-content text-center">Meet Our Team</Text>
          </View>
          <View className="gap-6 mb-12">
            <View className="card bg-base-200/50 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-32 h-32 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-xl mx-auto items-center justify-center">
                  <Text className="text-4xl">👨‍💻</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-lg font-bold text-primary">Rene Cian Baloloy</Text>
                <Text className="text-sm text-base-content/80">Backend Developer</Text>
              </View>
            </View>
            
            <View className="card bg-base-200/50 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-32 h-32 bg-gradient-to-br from-secondary/30 to-accent/30 rounded-xl mx-auto items-center justify-center">
                  <Text className="text-4xl">🎨</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-lg font-bold text-primary">Rean Joy Cicat</Text>
                <Text className="text-sm text-base-content/80">UI/UX Designer</Text>
              </View>
            </View>
            
            <View className="card bg-base-200/50 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-32 h-32 bg-gradient-to-br from-accent/30 to-primary/30 rounded-xl mx-auto items-center justify-center">
                  <Text className="text-4xl">💻</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-lg font-bold text-primary">Mark Al Bartolome</Text>
                <Text className="text-sm text-base-content/80">Frontend Developer</Text>
              </View>
            </View>
            
            <View className="card bg-base-200/50 shadow-xl">
              <View className="px-10 pt-10">
                <View className="w-32 h-32 bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl mx-auto items-center justify-center">
                  <Text className="text-4xl">🚀</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-lg font-bold text-primary">Daniel Davis</Text>
                <Text className="text-sm text-base-content/80">Full Stack Developer</Text>
              </View>
            </View>
          </View>
          
          <View className="items-center">
            <View className="card bg-base-200/50 shadow-xl w-80">
              <View className="px-10 pt-10">
                <View className="w-32 h-32 bg-gradient-to-br from-secondary/30 to-primary/30 rounded-xl mx-auto items-center justify-center">
                  <Text className="text-4xl">👩‍🏫</Text>
                </View>
              </View>
              <View className="card-body items-center text-center">
                <Text className="text-lg font-bold text-secondary">Our Professor</Text>
                <Text className="font-semibold text-primary">Mrs. Madriaga Pops</Text>
                <Text className="text-sm text-base-content/80">Project Supervisor</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}