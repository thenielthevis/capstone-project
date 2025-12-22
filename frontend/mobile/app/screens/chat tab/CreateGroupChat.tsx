import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchUsers, createGroupChat, User } from "../../api/chatApi";

export default function CreateGroupChat() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          // Filter out current user and already selected users
          const filteredResults = results.filter(
            (u: User) =>
              u._id !== user?._id &&
              !selectedUsers.some((selected) => selected._id === u._id)
          );
          setUsers(filteredResults);
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
  }, [searchQuery, user?._id, selectedUsers]);

  const handleSelectUser = (selectedUser: User) => {
    setSelectedUsers((prev) => [...prev, selectedUser]);
    setUsers((prev) => prev.filter((u) => u._id !== selectedUser._id));
    setSearchQuery("");
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (selectedUsers.length < 2) {
      Alert.alert("Error", "Please select at least 2 members for the group");
      return;
    }

    setCreating(true);
    try {
      const chat = await createGroupChat({
        name: groupName,
        users: selectedUsers.map((u) => u._id),
      });

      router.replace({
        pathname: "/screens/chat tab/ChatRoom" as any,
        params: {
          chatId: chat._id,
          chatName: groupName,
        },
      });
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const renderSelectedUser = ({ item }: { item: User }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.primary + "20",
        borderRadius: 20,
        paddingLeft: 4,
        paddingRight: 8,
        paddingVertical: 4,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: theme.colors.primary + "40",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 6,
        }}
      >
        {item.profilePicture ? (
          <Image
            source={{ uri: item.profilePicture }}
            style={{ width: 28, height: 28, borderRadius: 14 }}
          />
        ) : (
          <Ionicons name="person" size={16} color={theme.colors.primary} />
        )}
      </View>
      <Text
        style={{
          fontFamily: theme.fonts.body,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.primary,
          marginRight: 4,
        }}
      >
        {item.username}
      </Text>
      <TouchableOpacity
        onPress={() => handleRemoveUser(item._id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close-circle" size={18} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

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
      onPress={() => handleSelectUser(item)}
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

      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="add" size={16} color={theme.colors.primary} />
      </View>
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
            flex: 1,
          }}
        >
          New Group
        </Text>

        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={creating || !groupName.trim() || selectedUsers.length < 2}
          style={{
            backgroundColor:
              groupName.trim() && selectedUsers.length >= 2
                ? theme.colors.primary
                : theme.colors.primary + "50",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
          }}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.sm,
                color: "#fff",
              }}
            >
              Create
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Group Name Input */}
      <View
        style={{
          padding: 16,
          backgroundColor: theme.colors.surface,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.bodyBold,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          Group Name
        </Text>
        <TextInput
          style={{
            backgroundColor: theme.colors.input,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSizes.base,
            color: theme.colors.text,
          }}
          placeholder="Enter group name..."
          placeholderTextColor={theme.colors.text + "60"}
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.bodyBold,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
              marginBottom: 8,
            }}
          >
            Selected Members ({selectedUsers.length})
          </Text>
          <FlatList
            data={selectedUsers}
            renderItem={renderSelectedUser}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          />
        </View>
      )}

      {/* Search Input */}
      <View
        style={{
          padding: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.bodyBold,
            fontSize: theme.fontSizes.sm,
            color: theme.colors.text,
            marginBottom: 8,
          }}
        >
          Add Members
        </Text>
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
            placeholder="Search users..."
            placeholderTextColor={theme.colors.text + "60"}
            value={searchQuery}
            onChangeText={setSearchQuery}
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
      </View>

      {/* Search Results */}
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
                  name="people-outline"
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
                  Add group members
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text + "40",
                    marginTop: 8,
                    textAlign: "center",
                    paddingHorizontal: 32,
                  }}
                >
                  Search for users to add them to your group. You need at least 2
                  members.
                </Text>
              </>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}
