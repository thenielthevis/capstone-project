import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { tokenStorage } from "@/utils/tokenStorage";
import { lightTheme, darkTheme, oceanTheme } from "../../../design/tokens";
import * as WebBrowser from "expo-web-browser";
import { SafeAreaView } from "react-native-safe-area-context";

const themeOptions = [
  { key: "light", label: "Light", theme: lightTheme },
  { key: "dark", label: "Dark", theme: darkTheme },
  { key: "ocean", label: "Ocean", theme: oceanTheme },
];

// Settings Item Component
const SettingsItem = ({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  theme,
  showChevron = true,
  rightElement,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  theme: any;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      padding: 16,
      borderRadius: 16,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    }}
  >
    <View style={{
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: iconColor + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    }}>
      <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
    </View>

    <View style={{ flex: 1 }}>
      <Text style={{
        fontFamily: theme.fonts.bodyBold,
        fontSize: 15,
        color: theme.colors.text,
      }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{
          fontFamily: theme.fonts.body,
          fontSize: 12,
          color: theme.colors.text + '77',
          marginTop: 2,
        }}>
          {subtitle}
        </Text>
      )}
    </View>

    {rightElement}
    {showChevron && !rightElement && (
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text + '44'} />
    )}
  </TouchableOpacity>
);

// Section Header Component
const SectionHeader = ({ title, theme }: { title: string; theme: any }) => (
  <Text style={{
    fontFamily: theme.fonts.heading,
    fontSize: 13,
    color: theme.colors.primary,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }}>
    {title}
  </Text>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const openInAppBrowser = async (url: string) => {
    await WebBrowser.openBrowserAsync(url, {
      toolbarColor: theme.colors.background,
      controlsColor: theme.colors.text,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
    });
  };

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
            Settings
          </Text>
        </View>

        {/* Preferences Section */}
        <SectionHeader title="Preferences" theme={theme} />
        <SettingsItem
          icon="palette-outline"
          iconColor="#8b5cf6"
          title="Appearance"
          subtitle="Theme, colors & display"
          onPress={() => router.push("/screens/settings/appearance")}
          theme={theme}
        />
        <SettingsItem
          icon="bell-outline"
          iconColor="#0ea5e9"
          title="Health Checkup Reminders"
          subtitle="Set daily reminder times"
          onPress={() => router.push("/screens/settings/health-checkup-reminders")}
          theme={theme}
        />

        {/* Permissions Section */}
        <SectionHeader title="Permissions" theme={theme} />
        <SettingsItem
          icon="lock-outline"
          iconColor="#c2c2c0ff"
          title="App Permissions"
          subtitle="Manage app permissions"
          onPress={() => router.push("/screens/settings/permissions")}
          theme={theme}
        />

        {/* Legal Section */}
        <SectionHeader title="Legal" theme={theme} />
        <SettingsItem
          icon="file-document-outline"
          iconColor="#3b82f6"
          title="Terms and Conditions"
          subtitle="Usage terms and policies"
          onPress={() => openInAppBrowser("https://yourdomain.com/terms")}
          theme={theme}
        />
        <SettingsItem
          icon="shield-check-outline"
          iconColor="#10b981"
          title="Privacy Policy"
          subtitle="How we handle your data"
          onPress={() => openInAppBrowser("https://yourdomain.com/privacy")}
          theme={theme}
        />

        {/* Account Section */}
        <SectionHeader title="Account" theme={theme} />
        <SettingsItem
          icon="logout"
          iconColor="#ef4444"
          title="Sign Out"
          subtitle="Log out of your account"
          onPress={() => setShowLogoutModal(true)}
          theme={theme}
          showChevron={false}
          rightElement={
            <View style={{
              backgroundColor: '#ef444415',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}>
              <Ionicons name="exit-outline" size={18} color="#ef4444" />
            </View>
          }
        />

        {/* App Info */}
        <View style={{
          alignItems: 'center',
          marginTop: 32,
          paddingVertical: 20,
        }}>
          <View style={{
            width: 60,
            height: 60,
            borderRadius: 16,
            backgroundColor: theme.colors.primary + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <MaterialCommunityIcons name="heart-pulse" size={28} color={theme.colors.primary} />
          </View>
          <Text style={{
            fontFamily: theme.fonts.body,
            fontSize: 13,
            color: theme.colors.text + '55',
          }}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 24,
            marginHorizontal: 32,
            width: '85%',
            maxWidth: 340,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8,
          }}>
            {/* Icon */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#ef444415',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="exit-outline" size={32} color="#ef4444" />
              </View>
            </View>

            <Text style={{
              fontFamily: theme.fonts.heading,
              fontSize: 20,
              color: theme.colors.text,
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Sign Out?
            </Text>

            <Text style={{
              fontFamily: theme.fonts.body,
              fontSize: 14,
              color: theme.colors.text + '88',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}>
              Are you sure you want to sign out of your account?
            </Text>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowLogoutModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.background,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: 15,
                  color: theme.colors.text,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setShowLogoutModal(false);
                  await tokenStorage.removeToken();
                  router.replace("/");
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                }}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: 15,
                  color: '#FFFFFF',
                }}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}