import React from "react";
import { View, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../context/ThemeContext';
import { useRouter } from "expo-router";

type HeaderProps = {
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  profileImage?: string | null;
};

export default function Header({
  onProfilePress = () => {},
  onSettingsPress = () => {},
  onNotificationsPress = () => {},
  profileImage = null,
}: HeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View
      className="flex-row items-center justify-between h-16 px-4"
      style={{
        backgroundColor: theme.colors.surface,
        height: 64,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderBottomColor: theme.colors.secondary + "33",
        borderBottomWidth: 1,
        shadowColor: "#000",
      }}
    >
      <TouchableOpacity onPress={onProfilePress}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} className="w-10 h-10 rounded-full" />
        ) : (
          <Ionicons name="person-circle-outline" size={24} color={theme.colors.text} />
        )}
      </TouchableOpacity>

      {/* Right icons container */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} style={{ marginRight: 20 }} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/screens/settings/list")}>
          <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}