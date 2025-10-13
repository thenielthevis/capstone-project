import { Tabs } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

export default function HomeTabs() {
  const { theme } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
      'Inter': require('../../assets/fonts/Inter_18pt-Regular.ttf'),
      'Inter-Bold': require('../../assets/fonts/Inter_18pt-Bold.ttf'),
      'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
      'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
      'Roboto-Regular': require('../../assets/fonts/Roboto-Regular.ttf'),
      'Roboto-Bold': require('../../assets/fonts/Roboto-Bold.ttf'),
    });

    useEffect(() => {
      if (fontError) {
        console.error("Font loading error:", fontError);
      }
    }, [fontError]);
  
    if (!fontsLoaded && !fontError) {
      return null;
    }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <Header />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            height: 80,
            borderTopWidth: 0.1,
            borderTopColor: theme.colors.secondary + "33",
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
          tabBarIconStyle: {
            marginTop: 8,
            marginBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.text,
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            tabBarLabelStyle: {
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.xs,
            },
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? "home" : "home-outline"}
                color={focused ? theme.colors.primary : theme.colors.text}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Record"
          options={{
            tabBarLabelStyle: {
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.xs,
            },
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons
                size={24}
                name={focused ? "record-circle" : "record-circle-outline"}
                color={focused ? theme.colors.primary : theme.colors.text}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Avatar"
          options={{
            tabBarLabelStyle: {
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.xs,
            },
            tabBarIcon: ({ focused }) => (
              <FontAwesome6
                size={20}
                name="person-rays"
                color={focused ? theme.colors.primary : theme.colors.text}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Groups"
          options={{
            tabBarLabelStyle: {
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.xs,
            },
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? "people" : "people-outline"}
                color={focused ? theme.colors.primary : theme.colors.text}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Analysis"
          options={{
            tabBarLabelStyle: {
              fontFamily: theme.fonts.subheading,
              fontSize: theme.fontSizes.xs,
            },
            tabBarIcon: ({ focused }) => (
              <Ionicons
                size={24}
                name={focused ? "analytics" : "analytics-outline"}
                color={focused ? theme.colors.primary : theme.colors.text}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}