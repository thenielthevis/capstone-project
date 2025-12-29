import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchUsers, accessChat, User } from "../../api/chatApi";

export default function NewChat() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          // Filter out the current user
          setUsers(results.filter((u: User) => u._id !== user?._id));
        } catch (error) {
          console.error("Error searching users:", error);
        } finally {
          setSearching(false);
        }
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, user?._id]);

  const handleUserPress = async (selectedUser: User) => {
    if (creating) return;

    setCreating(true);
    try {
      const chat = await accessChat(selectedUser._id);
      router.replace({
        pathname: "/screens/chat tab/ChatRoom" as any,
        params: {
          chatId: chat._id,
          chatName: selectedUser.username,
        },
      });
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.background,
      }}
      onPress={() => handleUserPress(item)}
      disabled={creating}
    >
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.secondary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={{ width: 50, height: 50, borderRadius: 25 }}
          />
        ) : (
          <Ionicons name="person" size={24} color={theme.colors.secondary} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: theme.fonts.bodyBold,
            fontSize: theme.fontSizes.lg,
            color: theme.colors.text,
          }}
        >
          {item.username}
        </Text>
      </View>

      <Ionicons
        name="chatbubble-outline"
        size={20}
        color={theme.colors.primary}
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.background,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: theme.fontSizes.xl,
            color: theme.colors.text,
          }}
        >
          New Message
        </Text>
      </View>

      {/* Search Input */}
      <View
        style={{
          padding: 16,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.input,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.text + "60"}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={{
              flex: 1,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.base,
              color: theme.colors.text,
            }}
            placeholder="Search users by name or email..."
            placeholderTextColor={theme.colors.text + "60"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searching && (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          )}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.text + "60"}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text
          style={{
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.text + "60",
            marginTop: 8,
          }}
        >
          Enter at least 2 characters to search
        </Text>
      </View>

      {/* Results */}
      {creating ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.base,
              color: theme.colors.text + "80",
              marginTop: 16,
            }}
          >
            Starting conversation...
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
              }}
            >
              {searchQuery.length >= 2 && !searching ? (
                <>
                  <Ionicons
                    name="person-outline"
                    size={60}
                    color={theme.colors.text + "30"}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.lg,
                      color: theme.colors.text + "60",
                      marginTop: 16,
                    }}
                  >
                    No users found
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="search"
                    size={60}
                    color={theme.colors.text + "30"}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.lg,
                      color: theme.colors.text + "60",
                      marginTop: 16,
                    }}
                  >
                    Search for users
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.text + "40",
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    Find people to start a conversation with
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
