import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchChats,
  renameGroupChat,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupPhoto,
  searchUsers,
  Chat,
  User,
} from "../../api/chatApi";
import { getGroupPrograms, acceptProgram, declineProgram, Program } from "../../api/programApi";
import GroupProgramModal from "../../components/Modals/GroupProgramModal";
import * as ImagePicker from "expo-image-picker";

export default function ChatInfo() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();

  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [groupPrograms, setGroupPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showEditProgramModal, setShowEditProgramModal] = useState(false);

  const loadChatInfo = useCallback(async () => {
    if (!chatId) return;
    try {
      const chats = await fetchChats();
      const currentChat = chats.find((c) => c._id === chatId);
      if (currentChat) {
        setChat(currentChat);
        setNewGroupName(currentChat.chatName);
      }
    } catch (error) {
      console.error("Error fetching chat info:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    loadChatInfo();
  }, [loadChatInfo]);

  // Load group programs when chat is loaded and it's a group chat
  const loadGroupPrograms = useCallback(async () => {
    if (!chatId || !chat?.isGroupChat) return;
    setLoadingPrograms(true);
    try {
      const programs = await getGroupPrograms(chatId);
      setGroupPrograms(programs);
    } catch (error) {
      console.error("Error fetching group programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  }, [chatId, chat?.isGroupChat]);

  useEffect(() => {
    if (chat?.isGroupChat) {
      loadGroupPrograms();
    }
  }, [chat?.isGroupChat, loadGroupPrograms]);

  const handleAcceptProgram = async (programId: string) => {
    try {
      await acceptProgram(programId);
      Alert.alert("Success", "Program accepted! It will now appear in your programs.");
      loadGroupPrograms();
    } catch (error) {
      console.error("Error accepting program:", error);
      Alert.alert("Error", "Failed to accept program");
    }
  };

  const handleDeclineProgram = async (programId: string) => {
    Alert.alert(
      "Decline Program",
      "Are you sure you want to decline this program?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            try {
              await declineProgram(programId);
              Alert.alert("Declined", "You have declined this program.");
              loadGroupPrograms();
            } catch (error) {
              console.error("Error declining program:", error);
              Alert.alert("Error", "Failed to decline program");
            }
          },
        },
      ]
    );
  };

  // Check if user can edit a program (must be an accepted member)
  const canEditProgram = (program: Program) => {
    const currentUserId = user?.id || user?._id;
    const memberStatus = program.members?.find(
      (m) => m.user_id?._id === currentUserId || m.user_id === currentUserId
    );
    const isCreator = program.user_id?._id === currentUserId;
    const status = memberStatus?.status || (isCreator ? 'accepted' : 'pending');
    return status === 'accepted';
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setShowEditProgramModal(true);
  };

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2 && showAddMembers) {
        setSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          // Filter out current user and existing members
          const currentUserId = user?.id || user?._id;
          const existingUserIds = chat?.users.map((u) => u._id) || [];
          const filteredResults = results.filter(
            (u: User) =>
              u._id !== currentUserId && !existingUserIds.includes(u._id)
          );
          setSearchResults(filteredResults);
        } catch (error) {
          console.error("Error searching users:", error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchQuery, showAddMembers, chat?.users, user?.id, user?._id]);

  // Helper to get current user ID
  const getCurrentUserId = () => user?.id || user?._id;
  
  const isAdmin = chat?.groupAdmin?._id === getCurrentUserId();

  const handleChangeGroupPhoto = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "Only admin can change group photo");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photos to change the group photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri && chatId) {
        setUpdatingPhoto(true);
        try {
          // Upload to cloudinary or your backend
          // For now, we'll use the local URI (you should upload to your server)
          const imageUri = result.assets[0].uri;
          
          // Create form data for upload
          const formData = new FormData();
          formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "group_photo.jpg",
          } as any);
          formData.append("upload_preset", "chat_photos");

          // Upload to cloudinary (you need to configure this)
          // For simplicity, we're storing the local URI
          const updatedChat = await updateGroupPhoto(chatId, imageUri);
          setChat(updatedChat);
          Alert.alert("Success", "Group photo updated!");
        } catch (error) {
          console.error("Error updating group photo:", error);
          Alert.alert("Error", "Failed to update group photo");
        } finally {
          setUpdatingPhoto(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!chatId || !newGroupName.trim()) return;

    try {
      await renameGroupChat(chatId, newGroupName.trim());
      setChat((prev) =>
        prev ? { ...prev, chatName: newGroupName.trim() } : null
      );
      setEditingName(false);
    } catch (error) {
      console.error("Error updating group name:", error);
      Alert.alert("Error", "Failed to update group name");
    }
  };

  const handleAddMember = async (newUser: User) => {
    if (!chatId) return;

    try {
      const updatedChat = await addUserToGroup(chatId, newUser._id);
      setChat(updatedChat);
      setSearchResults((prev) => prev.filter((u) => u._id !== newUser._id));
      Alert.alert("Success", `${newUser.username} has been added to the group`);
    } catch (error) {
      console.error("Error adding member:", error);
      Alert.alert("Error", "Failed to add member");
    }
  };

  const handleRemoveMember = (member: User) => {
    if (!isAdmin) {
      Alert.alert("Error", "Only the admin can remove members");
      return;
    }

    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${member.username} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!chatId) return;
            try {
              const updatedChat = await removeUserFromGroup(chatId, member._id);
              setChat(updatedChat);
            } catch (error) {
              console.error("Error removing member:", error);
              Alert.alert("Error", "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            const currentUserId = getCurrentUserId();
            if (!chatId || !currentUserId) return;
            try {
              await removeUserFromGroup(chatId, currentUserId);
              router.replace("/(tabs)/Chat");
            } catch (error) {
              console.error("Error leaving group:", error);
              Alert.alert("Error", "Failed to leave group");
            }
          },
        },
      ]
    );
  };

  const handleStartDirectMessage = (member: User) => {
    router.push({
      pathname: "/screens/chat tab/ChatRoom" as any,
      params: { userId: member._id, chatName: member.username },
    });
  };

  const renderMemberItem = ({ item }: { item: User }) => {
    const isSelf = item._id === getCurrentUserId();
    const isChatAdmin = item._id === chat?.groupAdmin?._id;

    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: theme.colors.surface,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.secondary + "20",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <Ionicons name="person" size={22} color={theme.colors.secondary} />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.base,
                color: theme.colors.text,
              }}
            >
              {item.username}
              {isSelf && " (You)"}
            </Text>
            {isChatAdmin && (
              <View
                style={{
                  backgroundColor: theme.colors.primary + "20",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginLeft: 8,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.primary,
                  }}
                >
                  Admin
                </Text>
              </View>
            )}
          </View>
        </View>

        {!isSelf && (
          <View style={{ flexDirection: "row", gap: 8 }}>
            {/* Direct Message Button */}
            <TouchableOpacity
              style={{
                padding: 8,
                backgroundColor: theme.colors.primary + "15",
                borderRadius: 8,
              }}
              onPress={() => handleStartDirectMessage(item)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={theme.colors.primary}
              />
            </TouchableOpacity>

            {/* Remove Button (Admin only) */}
            {isAdmin && (
              <TouchableOpacity
                style={{
                  padding: 8,
                  backgroundColor: theme.colors.error + "15",
                  borderRadius: 8,
                }}
                onPress={() => handleRemoveMember(item)}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={18}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!chat) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.lg,
              color: theme.colors.text + "60",
            }}
          >
            Chat not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
          {chat.isGroupChat ? "Group Info" : "Chat Info"}
        </Text>
      </View>

      <ScrollView>
        {/* Chat Avatar and Name */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 24,
            backgroundColor: theme.colors.surface,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: chat.isGroupChat
                ? theme.colors.primary + "20"
                : theme.colors.secondary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              position: "relative",
            }}
            onPress={chat.isGroupChat && isAdmin ? handleChangeGroupPhoto : undefined}
            disabled={!chat.isGroupChat || !isAdmin || updatingPhoto}
          >
            {chat.isGroupChat ? (
              chat.groupPhoto ? (
                <Image
                  source={{ uri: chat.groupPhoto }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Ionicons name="people" size={40} color={theme.colors.primary} />
              )
            ) : (
              // For private chats, show the other user's profile picture
              (() => {
                const currentUserId = getCurrentUserId();
                const otherUser = chat.users.find((u) => u._id !== currentUserId);
                return otherUser?.profilePicture ? (
                  <Image
                    source={{ uri: otherUser.profilePicture }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                  />
                ) : (
                  <Ionicons name="person" size={40} color={theme.colors.secondary} />
                );
              })()
            )}
            {chat.isGroupChat && isAdmin && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: theme.colors.primary,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: theme.colors.surface,
                }}
              >
                {updatingPhoto ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="camera" size={14} color="#fff" />
                )}
              </View>
            )}
          </TouchableOpacity>

          {chat.isGroupChat && editingName ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "80%",
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: theme.colors.input,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.lg,
                  color: theme.colors.text,
                  textAlign: "center",
                }}
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <TouchableOpacity
                style={{ marginLeft: 8, padding: 8 }}
                onPress={handleUpdateGroupName}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => {
                  setEditingName(false);
                  setNewGroupName(chat.chatName);
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center" }}
              onPress={() => chat.isGroupChat && isAdmin && setEditingName(true)}
              disabled={!chat.isGroupChat || !isAdmin}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.heading,
                  fontSize: theme.fontSizes.xl,
                  color: theme.colors.text,
                }}
              >
                {chat.isGroupChat
                  ? chat.chatName
                  : (() => {
                      const currentUserId = getCurrentUserId();
                      const otherUser = chat.users.find((u) => u._id !== currentUserId);
                      return otherUser?.username || "Unknown User";
                    })()}
              </Text>
              {chat.isGroupChat && isAdmin && (
                <Ionicons
                  name="pencil"
                  size={16}
                  color={theme.colors.text + "60"}
                  style={{ marginLeft: 8 }}
                />
              )}
            </TouchableOpacity>
          )}

          <Text
            style={{
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text + "80",
              marginTop: 4,
            }}
          >
            {chat.isGroupChat
              ? `${chat.users.length} members`
              : "Direct Message"}
          </Text>
        </View>

        {/* Group Members Section */}
        {chat.isGroupChat && (
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.colors.surface,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.text,
                }}
              >
                Members ({chat.users.length})
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.primary + "15",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                  }}
                  onPress={() => setShowAddMembers(!showAddMembers)}
                >
                  <Ionicons
                    name={showAddMembers ? "close" : "add"}
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.primary,
                      marginLeft: 4,
                    }}
                  >
                    {showAddMembers ? "Cancel" : "Add"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add Members Search */}
            {showAddMembers && (
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingBottom: 12,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: theme.colors.input,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Ionicons
                    name="search"
                    size={18}
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
                    placeholder="Search users to add..."
                    placeholderTextColor={theme.colors.text + "60"}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searching && (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  )}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {searchResults.map((result) => (
                      <TouchableOpacity
                        key={result._id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 10,
                          borderBottomWidth: 1,
                          borderBottomColor: theme.colors.background,
                        }}
                        onPress={() => handleAddMember(result)}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: theme.colors.secondary + "20",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 10,
                          }}
                        >
                          {result.profilePicture ? (
                            <Image
                              source={{ uri: result.profilePicture }}
                              style={{ width: 36, height: 36, borderRadius: 18 }}
                            />
                          ) : (
                            <Ionicons
                              name="person"
                              size={18}
                              color={theme.colors.secondary}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: theme.fonts.body,
                              fontSize: theme.fontSizes.base,
                              color: theme.colors.text,
                            }}
                          >
                            {result.username}
                          </Text>
                        </View>
                        <Ionicons
                          name="add-circle"
                          size={22}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Members List */}
            <FlatList
              data={chat.users}
              renderItem={renderMemberItem}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.colors.background,
                    marginLeft: 72,
                  }}
                />
              )}
            />
          </View>
        )}

        {/* Group Programs Section */}
        {chat.isGroupChat && (
          <View style={{ marginBottom: 12 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialCommunityIcons
                  name="clipboard-list-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontFamily: theme.fonts.bodyBold,
                    fontSize: theme.fontSizes.base,
                    color: theme.colors.text,
                  }}
                >
                  Group Programs ({groupPrograms.length})
                </Text>
              </View>
            </View>

            {loadingPrograms ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : groupPrograms.length === 0 ? (
              <View
                style={{
                  padding: 20,
                  alignItems: "center",
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.text + "60",
                  }}
                >
                  No programs created for this group yet
                </Text>
              </View>
            ) : (
              <View style={{ backgroundColor: theme.colors.surface }}>
                {groupPrograms.map((program) => {
                  const currentUserId = user?.id || user?._id;
                  const memberStatus = program.members?.find(
                    (m) => m.user_id?._id === currentUserId || m.user_id === currentUserId
                  );
                  const isCreator = program.user_id?._id === currentUserId;
                  const status = memberStatus?.status || (isCreator ? 'accepted' : 'pending');
                  const acceptedCount = program.members?.filter(m => m.status === 'accepted').length || 0;
                  const totalMembers = program.members?.length || 0;

                  return (
                    <View
                      key={program._id}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.background,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            backgroundColor: theme.colors.primary + "15",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                          }}
                        >
                          <MaterialCommunityIcons
                            name="dumbbell"
                            size={22}
                            color={theme.colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text
                              style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: theme.fontSizes.base,
                                color: theme.colors.text,
                                flex: 1,
                              }}
                            >
                              {program.name}
                            </Text>
                            {/* Edit Button - visible to accepted members */}
                            {canEditProgram(program) && (
                              <TouchableOpacity
                                style={{
                                  padding: 6,
                                  backgroundColor: theme.colors.primary + "15",
                                  borderRadius: 6,
                                  marginLeft: 8,
                                }}
                                onPress={() => handleEditProgram(program)}
                              >
                                <Ionicons
                                  name="pencil"
                                  size={16}
                                  color={theme.colors.primary}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                          {program.description && (
                            <Text
                              style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.sm,
                                color: theme.colors.text + "80",
                                marginTop: 2,
                              }}
                              numberOfLines={2}
                            >
                              {program.description}
                            </Text>
                          )}
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                            <Text
                              style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.text + "60",
                              }}
                            >
                              Created by {program.user_id?.username || "Unknown"}
                            </Text>
                            <Text
                              style={{
                                fontFamily: theme.fonts.body,
                                fontSize: theme.fontSizes.xs,
                                color: theme.colors.text + "60",
                                marginLeft: 8,
                              }}
                            >
                              • {acceptedCount}/{totalMembers} accepted
                            </Text>
                          </View>
                          {/* Last Edited By */}
                          {program.last_edited_by && (
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                              <Ionicons
                                name="create-outline"
                                size={12}
                                color={theme.colors.secondary}
                                style={{ marginRight: 4 }}
                              />
                              <Text
                                style={{
                                  fontFamily: theme.fonts.body,
                                  fontSize: theme.fontSizes.xs,
                                  color: theme.colors.secondary,
                                }}
                              >
                                Last edited by {program.last_edited_by.username}
                                {program.last_edited_at && (
                                  ` • ${new Date(program.last_edited_at).toLocaleDateString()}`
                                )}
                              </Text>
                            </View>
                          )}

                          {/* Status Badge or Action Buttons */}
                          {status === 'pending' && !isCreator ? (
                            <View style={{ flexDirection: "row", marginTop: 10, gap: 8 }}>
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.colors.primary,
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  alignItems: "center",
                                }}
                                onPress={() => handleAcceptProgram(program._id)}
                              >
                                <Text
                                  style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: theme.fontSizes.sm,
                                    color: "#fff",
                                  }}
                                >
                                  Accept
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={{
                                  flex: 1,
                                  backgroundColor: theme.colors.error + "15",
                                  paddingVertical: 8,
                                  borderRadius: 8,
                                  alignItems: "center",
                                }}
                                onPress={() => handleDeclineProgram(program._id)}
                              >
                                <Text
                                  style={{
                                    fontFamily: theme.fonts.bodyBold,
                                    fontSize: theme.fontSizes.sm,
                                    color: theme.colors.error,
                                  }}
                                >
                                  Decline
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View
                              style={{
                                alignSelf: "flex-start",
                                backgroundColor:
                                  status === 'accepted'
                                    ? theme.colors.primary + "15"
                                    : theme.colors.error + "15",
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                                borderRadius: 12,
                                marginTop: 8,
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: theme.fonts.body,
                                  fontSize: theme.fontSizes.xs,
                                  color:
                                    status === 'accepted'
                                      ? theme.colors.primary
                                      : theme.colors.error,
                                }}
                              >
                                {status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={{ backgroundColor: theme.colors.surface, marginTop: 12 }}>
          {/* Report Chat */}
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.background,
            }}
            onPress={() => {
              Alert.alert(
                "Report",
                "Are you sure you want to report this chat?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Report",
                    style: "destructive",
                    onPress: () =>
                      Alert.alert("Reported", "Thank you for your report."),
                  },
                ]
              );
            }}
          >
            <Ionicons
              name="flag-outline"
              size={22}
              color={theme.colors.error}
              style={{ marginRight: 12 }}
            />
            <Text
              style={{
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.base,
                color: theme.colors.error,
              }}
            >
              Report {chat.isGroupChat ? "Group" : "Chat"}
            </Text>
          </TouchableOpacity>

          {/* Leave Group (for group chats only) */}
          {chat.isGroupChat && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 16,
              }}
              onPress={handleLeaveGroup}
            >
              <Ionicons
                name="exit-outline"
                size={22}
                color={theme.colors.error}
                style={{ marginRight: 12 }}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.error,
                }}
              >
                Leave Group
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Edit Group Program Modal */}
      {chat?.isGroupChat && (
        <GroupProgramModal
          visible={showEditProgramModal}
          onClose={() => {
            setShowEditProgramModal(false);
            setEditingProgram(null);
          }}
          groupId={chatId || ""}
          groupName={chat?.chatName || "Group"}
          editingProgram={editingProgram}
          onProgramUpdated={() => {
            loadGroupPrograms();
            setShowEditProgramModal(false);
            setEditingProgram(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
