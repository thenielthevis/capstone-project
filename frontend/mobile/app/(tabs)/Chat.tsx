import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Image,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { fetchChats, Chat } from "../api/chatApi";

export default function ChatTab() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "direct" | "groups">("all");

  const loadChats = useCallback(async () => {
    try {
      const data = await fetchChats();
      setChats(data);
      setFilteredChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    let filtered = chats;

    // Filter by tab
    if (activeTab === "direct") {
      filtered = filtered.filter((chat) => !chat.isGroupChat);
    } else if (activeTab === "groups") {
      filtered = filtered.filter((chat) => chat.isGroupChat);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const currentUserId = user?.id || user?._id;
      filtered = filtered.filter((chat) => {
        if (chat.isGroupChat) {
          return chat.chatName.toLowerCase().includes(searchQuery.toLowerCase());
        } else {
          const otherUser = chat.users.find((u) => u._id !== currentUserId);
          return otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
    }

    setFilteredChats(filtered);
  }, [searchQuery, activeTab, chats, user?.id, user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  // Helper to get current user's ID (handles both id and _id)
  const getCurrentUserId = () => user?.id || user?._id;

  const getChatName = (chat: Chat) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const currentUserId = getCurrentUserId();
    const otherUser = chat.users.find((u) => u._id !== currentUserId);
    return otherUser?.username || "Unknown User";
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroupChat) {
      return chat.groupPhoto || null;
    }
    const currentUserId = getCurrentUserId();
    const otherUser = chat.users.find((u) => u._id !== currentUserId);
    return otherUser?.profilePicture || null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatName = getChatName(item);
    const avatar = getChatAvatar(item);
    const latestMessage = item.latestMessage?.content || "No messages yet";
    const latestTime = item.latestMessage?.createdAt
      ? formatTime(item.latestMessage.createdAt)
      : "";

    return (
      <TouchableOpacity
        style={{
          flexDirection: "row",
          padding: 16,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.background,
        }}
        onPress={() =>
          router.push({
            pathname: "/screens/chat tab/ChatRoom" as any,
            params: { chatId: item._id, chatName },
          })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: item.isGroupChat
              ? theme.colors.primary + "20"
              : theme.colors.secondary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : item.isGroupChat ? (
            <Ionicons name="people" size={24} color={theme.colors.primary} />
          ) : (
            <Ionicons name="person" size={24} color={theme.colors.secondary} />
          )}
        </View>

        {/* Chat Info */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.lg,
                color: theme.colors.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {chatName}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.xs,
                color: theme.colors.text + "80",
                marginLeft: 8,
              }}
            >
              {latestTime}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            {item.isGroupChat && (
              <View
                style={{
                  backgroundColor: theme.colors.primary + "20",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.primary,
                  }}
                >
                  Group
                </Text>
              </View>
            )}
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text + "80",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {latestMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const TabButton = ({
    title,
    tab,
    count,
  }: {
    title: string;
    tab: "all" | "direct" | "groups";
    count: number;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderBottomWidth: 2,
        borderBottomColor:
          activeTab === tab ? theme.colors.primary : "transparent",
      }}
      onPress={() => setActiveTab(tab)}
    >
      <Text
        style={{
          fontFamily:
            activeTab === tab ? theme.fonts.bodyBold : theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: activeTab === tab ? theme.colors.primary : theme.colors.text + "80",
        }}
      >
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          padding: 16,
          backgroundColor: theme.colors.background,
        }}
      >

        {/* Search Bar */}
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
            placeholder="Search conversations..."
            placeholderTextColor={theme.colors.text + "60"}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.text + "60"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.background,
        }}
      >
        <TabButton
          title="All"
          tab="all"
          count={chats.length}
        />
        <TabButton
          title="Direct"
          tab="direct"
          count={chats.filter((c) => !c.isGroupChat).length}
        />
        <TabButton
          title="Groups"
          tab="groups"
          count={chats.filter((c) => c.isGroupChat).length}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            progressBackgroundColor={theme.colors.surface}
          />
        }
        ListEmptyComponent={
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={60}
              color={theme.colors.text + "40"}
            />
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.lg,
                color: theme.colors.text + "60",
                marginTop: 16,
              }}
            >
              No conversations yet
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
              Start a new chat or create a group
            </Text>
          </View>
        }
      />

      {/* Floating Action Buttons */}
      <View
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* New Group Chat Button */}
        <TouchableOpacity
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.secondary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={() => router.push("/screens/chat tab/CreateGroupChat" as any)}
        >
          <Ionicons name="people-outline" size={24} color="#fff" />
        </TouchableOpacity>

        {/* New Direct Message Button */}
        <TouchableOpacity
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
          onPress={() => router.push("/screens/chat tab/NewChat" as any)}
        >
          <MaterialIcons name="chat" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}