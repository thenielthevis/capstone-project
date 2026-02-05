import React from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from '../context/ThemeContext';
import { useRouter, Href } from "expo-router";
import { fontSizes } from "@/design/tokens";
import { useUser } from "../context/UserContext";

type HeaderProps = {
  onProfilePress?: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  profileImage?: string | null;
};

export default function Header({
  onProfilePress,
  onSettingsPress = () => { },
  onNotificationsPress = () => { },
  profileImage = null,
}: HeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useUser();

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/screens/profile" as Href);
    }
  };

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
        borderBottomColor: theme.colors.secondary + "11",
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
        {/* Leaderboard Button */}
        <TouchableOpacity 
          onPress={() => router.push("/screens/leaderboard/" as Href)} 
          activeOpacity={0.7}
          style={{
            marginRight: 12,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#fbbf24' + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name="trophy"
              size={18}
              color="#fbbf24"
            />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
          {user?.profilePicture ? (
            <Image
              source={{ uri: user.profilePicture }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                marginRight: 16,
                borderWidth: 2,
                borderColor: theme.colors.primary + '30',
              }}
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              <Ionicons
                name="person"
                size={18}
                color={theme.colors.primary}
              />
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onNotificationsPress} activeOpacity={0.7}>
          <Ionicons
            name="notifications-outline"
            size={26}
            style={{ marginRight: 16 }}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/screens/settings/list" as Href)} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={26} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}