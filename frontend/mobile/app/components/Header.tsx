import React from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../context/ThemeContext';
import { useRouter } from "expo-router";
import { fontSizes } from "@/design/tokens";
import { useUser } from "../context/UserContext";

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
  const { user } = useUser();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.colors.surface,
        height: 64,
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderBottomColor: theme.colors.secondary + "33",
        borderBottomWidth: 1,
        shadowColor: "#000",
        paddingHorizontal: 16,
      }}
    >
      {/* Left container: logo + text */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 32, height: 32 }}
          resizeMode="contain"
        />
        <Text
          style={{
            color: theme.colors.primary,
            fontSize: theme.fontSizes.xl,
            fontFamily: theme.fonts.heading,
            marginLeft: 10,
          }}
        >
          LIFORA
        </Text>
      </View>

      {/* Right icons container */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={onProfilePress}>
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={{ width: 28, height: 28, borderRadius: 20, marginRight: 20 }}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={28}
              style={{ marginRight: 20 }}
              color={theme.colors.text}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotificationsPress}>
          <Ionicons
            name="notifications-outline"
            size={28}
            style={{ marginRight: 20 }}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/screens/settings/list")}>
          <Ionicons name="settings-outline" size={28} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}