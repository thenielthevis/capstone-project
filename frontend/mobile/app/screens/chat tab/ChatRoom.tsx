import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fetchMessages,
  fetchChats,
  sendMessage as sendMessageApi,
  addReaction,
  reportMessage,
  markMessagesAsRead,
  Message,
  Chat
} from "../../api/chatApi";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { getGroupPrograms, acceptProgram, declineProgram, Program } from "../../api/programApi";
import { showToast } from "../../components/Toast/Toast";
import GroupProgramModal from "../../components/Modals/GroupProgramModal";
import ReportModal from "../../components/Modals/ReportModal";
import { ReportType } from "../../api/reportApi";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

const SUGGESTED_MESSAGES = [
  "Hey! How are you?",
  "Can we meet up later?",
  "Thanks for the info!",
  "Let me check and get back to you",
  "Sounds good! 👍",
];

export default function ChatRoom() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { chatId, chatName } = useLocalSearchParams<{
    chatId: string;
    chatName: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<Chat | null>(null);
  const [groupPrograms, setGroupPrograms] = useState<Program[]>([]);
  const [processingProgramId, setProcessingProgramId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showGroupProgramModal, setShowGroupProgramModal] = useState(false);

  // Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportItemId, setReportItemId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("message");
  const [reportItemName, setReportItemName] = useState<string | undefined>(undefined);

  const handleOpenReportModal = (type: ReportType, itemId: string, itemName?: string) => {
    setReportType(type);
    setReportItemId(itemId);
    setReportItemName(itemName);
    setShowReportModal(true);
    setShowOptionsModal(false);
    setSelectedMessage(null);
  };

  const flatListRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const data = await fetchMessages(chatId);
      setMessages(data);
      // Mark messages as read
      markMessagesAsRead(chatId).catch(console.error);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Load group programs for accept/decline functionality
  const loadGroupPrograms = useCallback(async () => {
    if (!chatId || !chat?.isGroupChat) return;
    try {
      const programs = await getGroupPrograms(chatId);
      setGroupPrograms(programs);
    } catch (error) {
      console.error("Error fetching group programs:", error);
    }
  }, [chatId, chat?.isGroupChat]);

  useEffect(() => {
    if (chat?.isGroupChat) {
      loadGroupPrograms();
    }
  }, [chat?.isGroupChat, loadGroupPrograms]);

  // Load chat data for avatar
  const loadChatData = useCallback(async () => {
    if (!chatId) return;
    try {
      const chats = await fetchChats();
      const currentChat = chats.find((c) => c._id === chatId);
      if (currentChat) {
        setChat(currentChat);
      }
    } catch (error) {
      console.error("Error fetching chat data:", error);
    }
  }, [chatId]);

  useEffect(() => {
    loadChatData();
  }, [loadChatData]);

  // Helper to get avatar for the chat header
  const getChatAvatar = () => {
    if (!chat) return null;
    if (chat.isGroupChat) {
      return chat.groupPhoto || null;
    }
    const currentUserId = user?.id || user?._id;
    const otherUser = chat.users.find((u) => u._id !== currentUserId);
    return otherUser?.profilePicture || null;
  };

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || sending) return;

    setSending(true);
    try {
      const sentMessage = await sendMessageApi(
        newMessage,
        chatId,
        replyingTo?._id
      );
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
      setReplyingTo(null);
      setShowSuggestions(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowOptionsModal(true);
  };

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage) return;

    try {
      const updatedMessage = await addReaction(selectedMessage._id, emoji);
      setMessages((prev) =>
        prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
    }

    setShowReactionModal(false);
    setShowOptionsModal(false);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setReplyingTo(selectedMessage);
    setShowOptionsModal(false);
    setSelectedMessage(null);
  };

  const handleReport = () => {
    if (!selectedMessage) return;
    handleOpenReportModal("message", selectedMessage._id);
  };

  // Handle accept program from chat
  const handleAcceptProgram = async (programId: string) => {
    setProcessingProgramId(programId);
    try {
      await acceptProgram(programId);
      showToast({
        type: "success",
        text1: "Program Accepted!",
        text2: "This program has been added to your programs",
      });
      loadGroupPrograms();
    } catch (error: any) {
      console.error("Error accepting program:", error);
      showToast({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to accept program",
      });
    } finally {
      setProcessingProgramId(null);
    }
  };

  // Handle decline program from chat
  const handleDeclineProgram = async (programId: string) => {
    setProcessingProgramId(programId);
    try {
      await declineProgram(programId);
      showToast({
        type: "info",
        text1: "Program Declined",
        text2: "You have declined this group program",
      });
      loadGroupPrograms();
    } catch (error: any) {
      console.error("Error declining program:", error);
      showToast({
        type: "error",
        text1: "Error",
        text2: error?.response?.data?.message || "Failed to decline program",
      });
    } finally {
      setProcessingProgramId(null);
    }
  };

  // Helper to check if a message is a program announcement
  const isProgramMessage = (content: string) => {
    return content.startsWith("📋 New Group Program Created!");
  };

  // Helper to extract program name from message
  const extractProgramName = (content: string) => {
    const match = content.match(/"([^"]+)"/);
    return match ? match[1] : null;
  };

  // Helper to find program by name
  const findProgramByName = (programName: string) => {
    return groupPrograms.find(p => p.name === programName);
  };

  // Get user's status for a program
  const getUserProgramStatus = (program: Program) => {
    const currentUserId = user?.id || user?._id;
    const member = program.members?.find(m =>
      m.user_id?._id === currentUserId || m.user_id === currentUserId
    );
    return member?.status || null;
  };

  const handleSuggestionPress = (suggestion: string) => {
    setNewMessage(suggestion);
    setShowSuggestions(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const shouldShowDateSeparator = (
    currentMessage: Message,
    previousMessage: Message | null
  ) => {
    if (!previousMessage) return true;
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    return currentDate !== previousDate;
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: Message;
    index: number;
  }) => {
    const currentUserId = user?.id || user?._id;
    const isOwnMessage = item.sender?._id === currentUserId;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);
    const messageReactions = item.reactions || [];
    const isProgram = isProgramMessage(item.content);

    // For program messages, find the associated program
    const programName = isProgram ? extractProgramName(item.content) : null;
    const associatedProgram = programName ? findProgramByName(programName) : null;
    const userStatus = associatedProgram ? getUserProgramStatus(associatedProgram) : null;
    const isCreator = associatedProgram?.user_id?._id === currentUserId;

    return (
      <>
        {showDateSeparator && (
          <View
            style={{
              alignItems: "center",
              marginVertical: 16,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.text + "80",
                }}
              >
                {formatDateSeparator(item.createdAt)}
              </Text>
            </View>
          </View>
        )}

        {/* Program Message - Special Styling */}
        {isProgram ? (
          <View
            style={{
              marginVertical: 8,
              marginHorizontal: 16,
            }}
          >
            <View
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.primary + "30",
                overflow: "hidden",
              }}
            >
              {/* Program Header */}
              <View
                style={{
                  backgroundColor: theme.colors.primary + "15",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: theme.colors.primary + "30",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialCommunityIcons
                    name="clipboard-text"
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.bodyBold,
                      fontSize: theme.fontSizes.base,
                      color: theme.colors.primary,
                    }}
                  >
                    New Group Program
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.xs,
                      color: theme.colors.text + "80",
                    }}
                  >
                    by {item.sender?.username || "Unknown"}
                  </Text>
                </View>
              </View>

              {/* Program Content */}
              <View style={{ padding: 16 }}>
                {programName && (
                  <Text
                    style={{
                      fontFamily: theme.fonts.heading,
                      fontSize: theme.fontSizes.lg,
                      color: theme.colors.text,
                      marginBottom: 8,
                    }}
                  >
                    "{programName}"
                  </Text>
                )}

                {/* Parse and display program details */}
                {item.content.split('\n').slice(2).map((line, idx) => {
                  if (line.startsWith('💪') || line.startsWith('🗺️')) {
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          marginTop: 6,
                        }}
                      >
                        <Text style={{ fontSize: 14, marginRight: 6 }}>
                          {line.startsWith('💪') ? '💪' : '🗺️'}
                        </Text>
                        <Text
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.sm,
                            color: theme.colors.text + "99",
                            flex: 1,
                          }}
                        >
                          {line.replace(/^(💪|🗺️)\s*(Workouts|Activities):\s*/, '')}
                        </Text>
                      </View>
                    );
                  } else if (line.trim() && !line.startsWith('📋') && !line.startsWith('"')) {
                    return (
                      <Text
                        key={idx}
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.text + "80",
                          marginBottom: 4,
                        }}
                      >
                        {line}
                      </Text>
                    );
                  }
                  return null;
                })}

                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.text + "50",
                    marginTop: 12,
                  }}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>

              {/* Accept/Decline Buttons - Only show for group members who are not the creator */}
              {chat?.isGroupChat && associatedProgram && !isCreator && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.background,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                >
                  {userStatus === 'pending' ? (
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.primary,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                        onPress={() => handleAcceptProgram(associatedProgram._id)}
                        disabled={processingProgramId === associatedProgram._id}
                      >
                        {processingProgramId === associatedProgram._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text
                              style={{
                                fontFamily: theme.fonts.bodyBold,
                                fontSize: theme.fontSizes.sm,
                                color: "#fff",
                                marginLeft: 6,
                              }}
                            >
                              Accept
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.background,
                          paddingVertical: 10,
                          borderRadius: 10,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: theme.colors.text + "30",
                        }}
                        onPress={() => handleDeclineProgram(associatedProgram._id)}
                        disabled={processingProgramId === associatedProgram._id}
                      >
                        <Ionicons name="close" size={18} color={theme.colors.text + "80"} />
                        <Text
                          style={{
                            fontFamily: theme.fonts.body,
                            fontSize: theme.fontSizes.sm,
                            color: theme.colors.text + "80",
                            marginLeft: 6,
                          }}
                        >
                          Decline
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : userStatus === 'accepted' ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.success + "15",
                        paddingVertical: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={theme.colors.success || "#22c55e"} />
                      <Text
                        style={{
                          fontFamily: theme.fonts.bodyBold,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.success || "#22c55e",
                          marginLeft: 6,
                        }}
                      >
                        You've joined this program
                      </Text>
                    </View>
                  ) : userStatus === 'declined' ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.text + "10",
                        paddingVertical: 10,
                        borderRadius: 10,
                      }}
                    >
                      <Ionicons name="close-circle" size={18} color={theme.colors.text + "60"} />
                      <Text
                        style={{
                          fontFamily: theme.fonts.body,
                          fontSize: theme.fontSizes.sm,
                          color: theme.colors.text + "60",
                          marginLeft: 6,
                        }}
                      >
                        You declined this program
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Creator badge */}
              {isCreator && (
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.background,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: theme.colors.primary + "10",
                  }}
                >
                  <Ionicons name="star" size={16} color={theme.colors.primary} />
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.primary,
                      marginLeft: 6,
                    }}
                  >
                    You created this program
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Regular Message */
          <TouchableOpacity
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.8}
            style={{
              flexDirection: "row",
              justifyContent: isOwnMessage ? "flex-end" : "flex-start",
              marginVertical: 4,
              marginHorizontal: 12,
            }}
          >
            {/* Avatar for other's messages */}
            {!isOwnMessage && (
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.colors.secondary + "30",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  alignSelf: "flex-end",
                }}
              >
                {item.sender?.profilePicture ? (
                  <Image
                    source={{ uri: item.sender.profilePicture }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                  />
                ) : (
                  <Ionicons name="person" size={18} color={theme.colors.secondary} />
                )}
              </View>
            )}

            <View style={{ maxWidth: "75%" }}>
              {/* Sender name for group chats */}
              {!isOwnMessage && (
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: theme.colors.text + "80",
                    marginBottom: 4,
                    marginLeft: 4,
                  }}
                >
                  {item.sender?.username || "Unknown"}
                </Text>
              )}

              {/* Message Bubble */}
              <View
                style={{
                  backgroundColor: isOwnMessage
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderRadius: 16,
                  borderTopRightRadius: isOwnMessage ? 4 : 16,
                  borderTopLeftRadius: isOwnMessage ? 16 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.base,
                    color: isOwnMessage ? "#fff" : theme.colors.text,
                  }}
                >
                  {item.content}
                </Text>
                <Text
                  style={{
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSizes.xs,
                    color: isOwnMessage ? "#ffffff90" : theme.colors.text + "60",
                    marginTop: 4,
                    alignSelf: "flex-end",
                  }}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>

              {/* Reactions */}
              {messageReactions.length > 0 && (
                <View
                  style={{
                    flexDirection: "row",
                    backgroundColor: theme.colors.surface,
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    marginTop: 4,
                    alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                    borderWidth: 1,
                    borderColor: theme.colors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                >
                  {messageReactions.map((reaction, i) => (
                    <Text key={i} style={{ fontSize: 14 }}>
                      {reaction.emoji}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.surface }}
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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.surface }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            backgroundColor: theme.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.background,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 8, marginRight: 4 }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: chat?.isGroupChat
                ? theme.colors.primary + "20"
                : theme.colors.secondary + "20",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
            onPress={() =>
              router.push({
                pathname: "/screens/chat tab/ChatInfo" as any,
                params: { chatId },
              })
            }
          >
            {getChatAvatar() ? (
              <Image
                source={{ uri: getChatAvatar()! }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : chat?.isGroupChat ? (
              <Ionicons name="people" size={20} color={theme.colors.primary} />
            ) : (
              <Ionicons name="person" size={20} color={theme.colors.secondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() =>
              router.push({
                pathname: "/screens/chat tab/ChatInfo" as any,
                params: { chatId },
              })
            }
          >
            <Text
              style={{
                fontFamily: theme.fonts.bodyBold,
                fontSize: theme.fontSizes.lg,
                color: theme.colors.text,
              }}
              numberOfLines={1}
            >
              {chatName || "Chat"}
            </Text>
            {chat?.isGroupChat && (
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.text + "80",
                }}
              >
                {chat.users.length} members
              </Text>
            )}
          </TouchableOpacity>

          {/* Create Group Program Button - Only for group chats */}
          {chat?.isGroupChat && (
            <TouchableOpacity
              style={{ padding: 8, marginRight: 4 }}
              onPress={() => setShowGroupProgramModal(true)}
            >
              <MaterialCommunityIcons
                name="clipboard-plus-outline"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{ padding: 8 }}
            onPress={() =>
              router.push({
                pathname: "/screens/chat tab/ChatInfo" as any,
                params: { chatId },
              })
            }
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
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
                name="chatbubble-ellipses-outline"
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
                No messages yet
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text + "40",
                  marginTop: 8,
                }}
              >
                Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Replying To Banner */}
        {replyingTo && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderTopWidth: 1,
              borderTopColor: theme.colors.background,
            }}
          >
            <View
              style={{
                width: 3,
                height: "100%",
                backgroundColor: theme.colors.primary,
                borderRadius: 2,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: theme.fonts.bodyBold,
                  fontSize: theme.fontSizes.xs,
                  color: theme.colors.primary,
                }}
              >
                Replying to {replyingTo.sender?.username}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.text + "80",
                }}
                numberOfLines={1}
              >
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons name="close" size={20} color={theme.colors.text + "60"} />
            </TouchableOpacity>
          </View>
        )}

        {/* Suggestions */}
        {showSuggestions && (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopWidth: 1,
              borderTopColor: theme.colors.background,
              paddingVertical: 8,
            }}
          >
            <FlatList
              horizontal
              data={SUGGESTED_MESSAGES}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary + "15",
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 16,
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.primary + "30",
                  }}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text
                    style={{
                      fontFamily: theme.fonts.body,
                      fontSize: theme.fontSizes.sm,
                      color: theme.colors.primary,
                    }}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Input Area */}
        {/* Input Area */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            paddingBottom: 12,
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.background,
          }}
        >
          {/* Suggestion Toggle */}
          <TouchableOpacity
            style={{
              padding: 10,
              marginRight: 4,
            }}
            onPress={() => setShowSuggestions(!showSuggestions)}
          >
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={24}
              color={
                showSuggestions ? theme.colors.primary : theme.colors.text + "60"
              }
            />
          </TouchableOpacity>

          {/* Text Input */}
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: theme.colors.input,
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 8,
              minHeight: 44,
              maxHeight: 120,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSizes.base,
                color: theme.colors.text,
                maxHeight: 100,
              }}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text + "60"}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                newMessage.trim() && !sending
                  ? theme.colors.primary
                  : theme.colors.primary + "50",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 8,
            }}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowOptionsModal(false)}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 16,
              width: "80%",
              maxWidth: 300,
            }}
          >
            {/* Reactions Row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.background,
              }}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={{
                    padding: 8,
                  }}
                  onPress={() => handleReaction(emoji)}
                >
                  <Text style={{ fontSize: 28 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
              onPress={handleReply}
            >
              <Ionicons
                name="arrow-undo-outline"
                size={22}
                color={theme.colors.text}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.text,
                  marginLeft: 16,
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
              onPress={async () => {
                if (selectedMessage?.content) {
                  await Clipboard.setStringAsync(selectedMessage.content);
                  Alert.alert("Copied", "Message copied to clipboard");
                }
                setShowOptionsModal(false);
                setSelectedMessage(null);
              }}
            >
              <Ionicons
                name="copy-outline"
                size={22}
                color={theme.colors.text}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.text,
                  marginLeft: 16,
                }}
              >
                Copy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 14,
              }}
              onPress={handleReport}
            >
              <Ionicons
                name="flag-outline"
                size={22}
                color={theme.colors.error}
              />
              <Text
                style={{
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSizes.base,
                  color: theme.colors.error,
                  marginLeft: 16,
                }}
              >
                Report
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Group Program Modal */}
      {
        chat?.isGroupChat && (
          <GroupProgramModal
            visible={showGroupProgramModal}
            onClose={() => setShowGroupProgramModal(false)}
            groupId={chatId || ""}
            groupName={chatName || chat?.chatName || "Group"}
            onProgramCreated={() => {
              // Refresh messages to show the new program announcement
              loadMessages();
              // Refresh programs list for accept/decline functionality
              loadGroupPrograms();
              // Scroll to bottom after a short delay to show the new message
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 500);
            }}
          />
        )
      }

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportItemId(null);
          setReportItemName(undefined);
        }}
        reportType={reportType}
        itemId={reportItemId || ""}
        itemName={reportItemName}
      />
    </SafeAreaView >
  );
}
