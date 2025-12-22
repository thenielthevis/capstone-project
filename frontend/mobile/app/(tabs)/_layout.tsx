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
                height: 65,
                borderTopWidth: 0,
                paddingTop: 6,
                paddingBottom: 8,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 5,
              },
              tabBarItemStyle: {
                paddingVertical: 2,
              },
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: "600",
                marginTop: 2,
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: theme.colors.text + "99",
            }}
          >
            <Tabs.Screen
              name="Home"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  marginTop: 2,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 32,
                      width: 60,
                      borderRadius: 16,
                      backgroundColor: focused ? theme.colors.primary + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={26}
                      name={focused ? "home" : "home-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text + "99"}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="Record"
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  marginTop: 10,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 32,
                      width: 60,
                      borderRadius: 16,
                      backgroundColor:
                        focused || recordMenuOpen ? theme.colors.primary + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 16,
                    }}
                  >
                    <MaterialCommunityIcons
                      size={26}
                      name={focused || recordMenuOpen ? "plus-circle" : "plus-circle-outline"}
                      color={focused || recordMenuOpen ? theme.colors.primary : theme.colors.text + "99"}
                    />
                  </View>
                ),
                tabBarButton: (props) => {
                  const { children, onPress, onLongPress, accessibilityState, accessibilityLabel, testID, style } = props;
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={accessibilityState}
                      accessibilityLabel={accessibilityLabel}
                      testID={testID}
                      activeOpacity={0.7}
                      style={[style, { alignItems: "center", justifyContent: "center" }]}
                      onPress={(e) => {
                        onPress?.(e);
                        setRecordMenuOpen((prev) => !prev);
                      }}
                      onLongPress={onLongPress ?? undefined}
                    >
                      {children}
                    </TouchableOpacity>
                  );
                },
              }}
            />
            <Tabs.Screen
              name="Avatar"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  marginTop: 2,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 32,
                      width: 60,
                      borderRadius: 16,
                      backgroundColor: focused ? theme.colors.primary + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FontAwesome6
                      size={22}
                      name="person-rays"
                      color={focused ? theme.colors.primary : theme.colors.text + "99"}
                    />
                  </View>
                ),
              }}
            />
            <Tabs.Screen
              name="Chat"
              listeners={{
                tabPress: () => setRecordMenuOpen(false),
              }}
              options={{
                tabBarLabelStyle: {
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  marginTop: 2,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 32,
                      width: 60,
                      borderRadius: 16,
                      backgroundColor: focused ? theme.colors.primary + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={26}
                      name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text + "99"}
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
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  marginTop: 2,
                },
                tabBarIcon: ({ focused }) => (
                  <View
                    style={{
                      height: 32,
                      width: 60,
                      borderRadius: 16,
                      backgroundColor: focused ? theme.colors.primary + "20" : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      size={26}
                      name={focused ? "analytics" : "analytics-outline"}
                      color={focused ? theme.colors.primary : theme.colors.text + "99"}
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
              bottom: 65,
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
                      borderRadius: 24,
                      paddingHorizontal: 18,
                      paddingVertical: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 8,
                      elevation: 6,
                      borderWidth: 1,
                      borderColor: theme.colors.primary + "15",
                      justifyContent: "center",
                    }}
                  >
                    {action.icon}
                    <Text
                      style={{
                        marginLeft: 10,
                        color: theme.colors.text,
                        fontFamily: theme.fonts.body,
                        fontWeight: "500",
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