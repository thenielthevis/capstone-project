import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { tokenStorage } from "@/utils/tokenStorage";
import { lightTheme, darkTheme, oceanTheme } from "../../../design/tokens";
import * as WebBrowser from "expo-web-browser";

const themeOptions = [
  { key: "light", label: "Light", theme: lightTheme },
  { key: "dark", label: "Dark", theme: darkTheme },
  { key: "ocean", label: "Ocean", theme: oceanTheme },
];

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
    <View className="flex-1 px-4 py-6" style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-row items-center mt-8">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={theme.fontSizes.xl + 4} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          className="ml-2"
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.xl,
            lineHeight: theme.fontSizes.xl * 1.2,
          }}
        >
          Settings
        </Text>
      </View>

      {/* PREFERENCES SECTION */}
      <Text className="mt-8 mb-2" style={{ color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base}}>
        Preferences
      </Text>
      <TouchableOpacity
        className="flex-row items-center justify-between py-4 border-b"
        style={{ borderBottomColor: theme.colors.secondary + "33" }}
        onPress={() => router.push("/screens/settings/appearance")}
      >
        <Text className="text-base" style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>Appearance</Text>
        <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.secondary} />
      </TouchableOpacity>

      {/* LEGAL SECTION */}
      <Text className="mt-8 mb-2" style={{ color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base }}>
        Legal
      </Text>
      <TouchableOpacity
        className="flex-row items-center justify-between py-4 border-b"
        style={{ borderBottomColor: theme.colors.secondary + "33" }}
        onPress={() => openInAppBrowser("https://yourdomain.com/terms")}
      >
        <Text className="text-base" style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>Terms and Conditions</Text>
        <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.secondary} />
      </TouchableOpacity>
      <TouchableOpacity
        className="flex-row items-center justify-between py-4 border-b"
        style={{ borderBottomColor: theme.colors.secondary + "33" }}
        onPress={() => openInAppBrowser("https://yourdomain.com/privacy")}
      >
        <Text className="text-base" style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>Privacy Policy</Text>
        <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.secondary} />
      </TouchableOpacity>

      {/* LOG OUT SECTION */}
      <Text className="mt-8 mb-2 font-semibold" style={{ color: theme.colors.primary, fontFamily: theme.fonts.bodyBold, fontSize: theme.fontSizes.base }}>
        Account
      </Text>
      <TouchableOpacity
        className="flex-row items-center justify-between py-4 border-b"
        style={{ borderBottomColor: theme.colors.secondary + "33" }}
        onPress={() => setShowLogoutModal(true)}
      >
        <Text className="text-base" style={{ color: theme.colors.text, fontFamily: theme.fonts.body, fontSize: theme.fontSizes.m }}>Sign Out</Text>
        <Ionicons name="exit-outline" size={20} style={{color: theme.colors.secondary}} />
      </TouchableOpacity>

      {/* Themed Minimal Alert-Style Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: theme.colors.overlay }}
        >
          <View
            className="rounded-xl p-7 mx-4 w-10/12"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Text
              className="font-bold mb-2"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.heading,
                fontSize: theme.fontSizes.lg,
              }}
            >
              Sign Out
            </Text>

            <Text
              className="mb-10"
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.m,
              }}
            >
              Are you sure you want to sign out?
            </Text>

            <View className="flex-row justify-end">
              <TouchableOpacity onPress={() => setShowLogoutModal(false)}>
                <Text
                  style={{
                    color: theme.colors.text + "88",
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                    marginRight: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  setShowLogoutModal(false);
                  await tokenStorage.removeToken();
                  router.dismissAll();
                  router.replace("/");
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text + "88",
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.m,
                  }}
                >
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}