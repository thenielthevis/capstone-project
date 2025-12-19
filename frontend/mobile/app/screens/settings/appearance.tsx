import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { lightTheme, darkTheme, oceanTheme } from "../../../design/tokens";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const themeOptions = [
  {
    key: "light",
    label: "Light",
    description: "Clean & bright",
    icon: "white-balance-sunny",
    theme: lightTheme,
  },
  {
    key: "dark",
    label: "Dark",
    description: "Easy on the eyes",
    icon: "moon-waning-crescent",
    theme: darkTheme,
  },
  {
    key: "ocean",
    label: "Ocean",
    description: "Calm & serene",
    icon: "waves",
    theme: oceanTheme,
  },
];

export default function AppearanceScreen() {
  const { themeKey, setThemeKey, theme } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 8,
          paddingBottom: 24,
        }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={{
            fontFamily: theme.fonts.heading,
            fontSize: 28,
            color: theme.colors.text,
          }}>
            Appearance
          </Text>
        </View>

        {/* Section Header */}
        <Text style={{
          fontFamily: theme.fonts.heading,
          fontSize: 13,
          color: theme.colors.primary,
          marginBottom: 16,
          marginLeft: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Choose Theme
        </Text>

        {/* Theme Cards */}
        {themeOptions.map((option) => {
          const isSelected = themeKey === option.key;
          
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => setThemeKey(option.key as any)}
              activeOpacity={0.7}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 2,
                borderColor: isSelected ? theme.colors.primary : 'transparent',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isSelected ? 0.08 : 0.04,
                shadowRadius: 8,
                elevation: isSelected ? 3 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Icon Container */}
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 14,
                  backgroundColor: option.theme.colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <MaterialCommunityIcons 
                    name={option.icon as any} 
                    size={26} 
                    color={option.theme.colors.primary} 
                  />
                </View>
                
                {/* Text Content */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: 16,
                    color: theme.colors.text,
                    marginBottom: 2,
                  }}>
                    {option.label}
                  </Text>
                  <Text style={{
                    fontFamily: theme.fonts.body,
                    fontSize: 13,
                    color: theme.colors.text + '77',
                  }}>
                    {option.description}
                  </Text>
                </View>

                {/* Color Preview */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  marginRight: 8,
                }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: option.theme.colors.background,
                    borderWidth: 2,
                    borderColor: theme.colors.text + '15',
                    marginRight: -8,
                    zIndex: 1,
                  }} />
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: option.theme.colors.surface,
                    borderWidth: 2,
                    borderColor: theme.colors.text + '15',
                    marginRight: -8,
                    zIndex: 2,
                  }} />
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: option.theme.colors.primary,
                    borderWidth: 2,
                    borderColor: theme.colors.text + '15',
                    marginRight: -8,
                    zIndex: 3,
                  }} />
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: option.theme.colors.accent,
                    borderWidth: 2,
                    borderColor: theme.colors.text + '15',
                    zIndex: 4,
                  }} />
                </View>

                {/* Selection Indicator */}
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.text + '22',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 8,
                }}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Preview Section */}
        <Text style={{
          fontFamily: theme.fonts.heading,
          fontSize: 13,
          color: theme.colors.primary,
          marginBottom: 16,
          marginTop: 24,
          marginLeft: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          Preview
        </Text>

        {/* Preview Card */}
        <View style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 20,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
          {/* Mock Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
            </View>
            <View>
              <Text style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: 14,
                color: theme.colors.text,
              }}>
                Sample User
              </Text>
              <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: 12,
                color: theme.colors.text + '77',
              }}>
                How your app looks
              </Text>
            </View>
          </View>

          {/* Mock Stats */}
          <View style={{ 
            flexDirection: 'row', 
            backgroundColor: theme.colors.background,
            borderRadius: 14,
            padding: 12,
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontFamily: theme.fonts.heading,
                fontSize: 18,
                color: theme.colors.primary,
              }}>
                1,250
              </Text>
              <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: 11,
                color: theme.colors.text + '77',
              }}>
                Calories
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.colors.text + '15' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{
                fontFamily: theme.fonts.heading,
                fontSize: 18,
                color: theme.colors.accent,
              }}>
                85%
              </Text>
              <Text style={{
                fontFamily: theme.fonts.body,
                fontSize: 11,
                color: theme.colors.text + '77',
              }}>
                Goal
              </Text>
            </View>
          </View>

          {/* Mock Button */}
          <View style={{
            backgroundColor: theme.colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 16,
          }}>
            <Text style={{
              fontFamily: theme.fonts.bodyBold,
              fontSize: 14,
              color: '#FFFFFF',
            }}>
              Sample Button
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}