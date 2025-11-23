import { Tabs, useRouter, Href } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import { useTheme } from "../context/ThemeContext";
import { useFonts } from "expo-font";
import { useEffect, useState, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, TouchableOpacity, Text } from "react-native";

export default function HomeTabs() {
  const { theme } = useTheme();
  const router = useRouter();
  const [recordMenuOpen, setRecordMenuOpen] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter: require("../../assets/fonts/Inter_18pt-Regular.ttf"),
    "Inter-Bold": require("../../assets/fonts/Inter_18pt-Bold.ttf"),
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Bold": require("../../assets/fonts/Poppins-Bold.ttf"),
    "Roboto-Regular": require("../../assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("../../assets/fonts/Roboto-Bold.ttf"),
  });

  useEffect(() => {
    if (fontError) {
      console.error("Font loading error:", fontError);
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const recordActions = useMemo(
    () => [
      {
        key: "food",
        label: "Food",
        icon: <MaterialCommunityIcons name="food-fork-drink" size={20} color={theme.colors.primary} />,
        route: "/screens/record/Food" as Href,
      },
      {
        key: "activity",
        label: "Activity",
        icon: <FontAwesome6 name="person-running" size={20} color={theme.colors.primary} />,
        route: "/screens/record/Program" as Href,
      },
    ],
    [theme.colors.primary]
  );

  const handleActionPress = (route: Href) => {
    setRecordMenuOpen(false);
    router.push(route);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
        <Header />
        <View style={{ flex: 1 }}>
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
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.subheading,
                  fontSize: theme.fontSizes.xs,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 35,
                      width: 50,
                      borderRadius: 10,
                      borderWidth: focused ? 1 : 0,
                      borderColor: "transparent",
                      backgroundColor: focused ? theme.colors.primary + "30" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={24}
                      name={focused ? "home" : "home-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text}
                    />
                  </View>
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
                  <View
                    style={{
                      height: 35,
                      width: 50,
                      borderRadius: 10,
                      borderWidth: focused || recordMenuOpen ? 1 : 0,
                      borderColor: "transparent",
                      backgroundColor:
                        focused || recordMenuOpen ? theme.colors.primary + "30" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialCommunityIcons
                      size={24}
                      name={focused ? "record-circle" : "record-circle-outline"}
                      color={focused || recordMenuOpen ? theme.colors.primary : theme.colors.text}
                    />
                  </View>
                ),
                tabBarButton: ({ children, onPress, onLongPress, accessibilityState, accessibilityLabel, testID }) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={accessibilityState}
                    accessibilityLabel={accessibilityLabel}
                    testID={testID}
                    activeOpacity={0.9}
                    style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 7 }}
                    onPress={(e) => {
                      onPress?.(e);
                      setRecordMenuOpen((prev) => !prev);
                    }}
                    onLongPress={onLongPress ?? undefined}
                  >
                    {children}
                  </TouchableOpacity>
                ),
              }}
            />
            <Tabs.Screen
              name="Avatar"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.subheading,
                  fontSize: theme.fontSizes.xs,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 35,
                      width: 50,
                      borderRadius: 10,
                      borderWidth: focused ? 1 : 0,
                      borderColor: "transparent",
                      backgroundColor: focused ? theme.colors.primary + "30" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome6
                      size={20}
                      name="person-rays"
                      color={focused ? theme.colors.primary : theme.colors.text}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="Groups"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.subheading,
                  fontSize: theme.fontSizes.xs,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 35,
                      width: 50,
                      borderRadius: 10,
                      borderWidth: focused ? 1 : 0,
                      borderColor: "transparent",
                      backgroundColor: focused ? theme.colors.primary + "30" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={24}
                      name={focused ? "people" : "people-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="Analysis"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.subheading,
                  fontSize: theme.fontSizes.xs,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 35,
                      width: 50,
                      borderRadius: 10,
                      borderWidth: focused ? 1 : 0,
                      borderColor: "transparent",
                      backgroundColor: focused ? theme.colors.primary + "30" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={24}
                      name={focused ? "analytics" : "analytics-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text}
                    />
                  </View>
                ),
              }}
            />
          </Tabs>

          {recordMenuOpen && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setRecordMenuOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "#00000055",
              }}
            />
          )}

          <View
            pointerEvents="box-none"
            style={{
              position: "absolute",
              bottom: 80,
              left: 60,
              alignItems: "flex-end",
            }}
          >
            {recordMenuOpen && (
              <View style={{ marginBottom: 12, gap: 10 }}>
                {recordActions.map((action) => (
                  <TouchableOpacity
                    key={action.key}
                    activeOpacity={0.85}
                    onPress={() => handleActionPress(action.route)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: theme.colors.surface,
                      borderRadius: 999,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      shadowColor: "#000",
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 4,
                      borderWidth: 1,
                      borderColor: theme.colors.text + "10",
                      justifyContent: "center",
                    }}
                  >
                    {action.icon}
                    <Text
                      style={{
                        marginLeft: 8,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.subheading,
                      }}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}