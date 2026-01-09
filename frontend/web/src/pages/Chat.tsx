import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import GroupProgramModal from '@/components/GroupProgramModal';
import { ReportType } from '@/api/reportApi';
import {
  fetchChats,
  fetchMessages,
  sendMessage,
  Chat as ChatType,
  Message,
  searchUsers,
  accessChat,
  createGroupChat,
  addReaction,
  markMessagesAsRead,
  User as UserType,
  removeUserFromGroup,
  updateGroupPhoto,
} from '@/api/chatApi';
import {
  getGroupPrograms,
  acceptProgram,
  declineProgram,
  Program,
} from '@/api/programApi';
import {
  Search,
  Users,
  User,
  Send,
  ArrowLeft,
  MessageSquare,
  Plus,
  RefreshCw,
  Smile,
  Reply,
  Copy,
  Flag,
  X,
  Check,
  Info,
  LogOut,
  Camera,
  Dumbbell,
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const SUGGESTED_MESSAGES = [
  "Hey! How are you?",
  "Can we meet up later?",
  "Thanks for the info!",
  "Let me check and get back to you",
  "Sounds good! 👍",
];

export default function Chat() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<ChatType[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');

  // Chat room state
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // New chat modal state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Enhanced features state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [messageOptionsPosition, setMessageOptionsPosition] = useState({ x: 0, y: 0 });
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserType[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleReport = (type: ReportType, itemId: string, itemName?: string) => {
    const params = new URLSearchParams({ type, id: itemId });
    if (itemName) params.append('name', itemName);
    setShowMessageOptions(false);
    setSelectedMessage(null);
    navigate(`/report?${params.toString()}`);
  };
  
  // Group program state
  const [groupPrograms, setGroupPrograms] = useState<Program[]>([]);
  const [processingProgramId, setProcessingProgramId] = useState<string | null>(null);
  const [showGroupProgramModal, setShowGroupProgramModal] = useState(false);

  // Dismiss suggestions when user starts typing
  useEffect(() => {
    if (newMessage.trim()) {
      setShowSuggestions(false);
    }
  }, [newMessage]);

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchChats();
      setChats(data);
      setFilteredChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    let filtered = chats;

    if (activeTab === 'direct') {
      filtered = filtered.filter((chat) => !chat.isGroupChat);
    } else if (activeTab === 'groups') {
      filtered = filtered.filter((chat) => chat.isGroupChat);
    }

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

  const getCurrentUserId = () => user?.id || user?._id;

  const getChatName = (chat: ChatType) => {
    if (chat.isGroupChat) {
      return chat.chatName;
    }
    const currentUserId = getCurrentUserId();
    const otherUser = chat.users.find((u) => u._id !== currentUserId);
    return otherUser?.username || 'Unknown User';
  };

  const getChatAvatar = (chat: ChatType) => {
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleSelectChat = async (chat: ChatType) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const msgs = await fetchMessages(chat._id);
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    setSendingMessage(true);
    try {
      const sentMessage = await sendMessage(newMessage, selectedChat._id);
      setMessages([...messages, sentMessage]);
      setNewMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const users = await searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartChat = async (targetUser: UserType) => {
    try {
      const chat = await accessChat(targetUser._id);
      setShowNewChatModal(false);
      setUserSearchQuery('');
      setSearchResults([]);
      await loadChats();
      setSelectedChat(chat);
      handleSelectChat(chat);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Message polling for real-time updates
  useEffect(() => {
    if (!selectedChat) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const msgs = await fetchMessages(selectedChat._id);
        setMessages(msgs);
        // Mark messages as read
        await markMessagesAsRead(selectedChat._id);
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedChat]);

  // Handle right click on message for options
  const handleMessageRightClick = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setSelectedMessage(message);
    
    // Calculate position to keep menu visible
    const menuWidth = 200;
    const menuHeight = 180;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Adjust x position if menu would go off right edge
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10;
    }
    
    // Adjust y position if menu would go off bottom edge
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }
    
    setMessageOptionsPosition({ x, y });
    setShowMessageOptions(true);
  };

  // Handle adding reaction to message
  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !selectedChat) return;
    try {
      await addReaction(selectedMessage._id, emoji);
      // Refresh messages to show reaction
      const msgs = await fetchMessages(selectedChat._id);
      setMessages(msgs);
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setShowReactionPicker(false);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    }
  };

  // Handle reply to message
  const handleReply = () => {
    if (selectedMessage) {
      setReplyingTo(selectedMessage);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    }
  };

  // Handle copy message
  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.content);
      setShowMessageOptions(false);
      setSelectedMessage(null);
    }
  };

  // Handle report message
  const handleReportMessage = () => {
    if (!selectedMessage) return;
    handleReport('message', selectedMessage._id);
  };

  // Handle create group
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.length < 2) return;
    
    setCreatingGroup(true);
    try {
      const userIds = selectedGroupUsers.map((u) => u._id);
      const chat = await createGroupChat({ name: groupName, users: userIds });
      setShowCreateGroupModal(false);
      setGroupName('');
      setSelectedGroupUsers([]);
      await loadChats();
      setSelectedChat(chat);
      handleSelectChat(chat);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Toggle user selection for group
  const toggleUserForGroup = (targetUser: UserType) => {
    const isSelected = selectedGroupUsers.some((u) => u._id === targetUser._id);
    if (isSelected) {
      setSelectedGroupUsers(selectedGroupUsers.filter((u) => u._id !== targetUser._id));
    } else {
      setSelectedGroupUsers([...selectedGroupUsers, targetUser]);
    }
  };

  // Format date separator
  const formatDateSeparator = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Check if should show date separator
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== prevDate;
  };

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!selectedChat || !user) return;
    
    const userId = user.id || user._id;
    if (!userId) return;

    const confirmed = window.confirm('Are you sure you want to leave this group?');
    if (!confirmed) return;

    setLeavingGroup(true);
    try {
      await removeUserFromGroup(selectedChat._id, userId);
      setSelectedChat(null);
      await loadChats();
      alert('You have left the group');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group');
    } finally {
      setLeavingGroup(false);
    }
  };

  // Handle change group photo
  const handleChangeGroupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    setUpdatingPhoto(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        try {
          const updatedChat = await updateGroupPhoto(selectedChat._id, base64String);
          setSelectedChat(updatedChat);
          alert('Group photo updated successfully');
        } catch (error) {
          console.error('Error updating group photo:', error);
          alert('Failed to update group photo');
        } finally {
          setUpdatingPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      setUpdatingPhoto(false);
    }
  };

  // Load group programs for accept/decline functionality
  const loadGroupPrograms = useCallback(async () => {
    if (!selectedChat?.isGroupChat) return;
    try {
      const programs = await getGroupPrograms(selectedChat._id);
      setGroupPrograms(programs);
    } catch (error) {
      console.error('Error fetching group programs:', error);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (selectedChat?.isGroupChat) {
      loadGroupPrograms();
    }
  }, [selectedChat?.isGroupChat, loadGroupPrograms]);

  // Handle accept program from chat
  const handleAcceptProgram = async (programId: string) => {
    setProcessingProgramId(programId);
    try {
      await acceptProgram(programId);
      alert('Program Accepted! This program has been added to your programs.');
      loadGroupPrograms();
    } catch (error: any) {
      console.error('Error accepting program:', error);
      alert(error?.response?.data?.message || 'Failed to accept program');
    } finally {
      setProcessingProgramId(null);
    }
  };

  // Handle decline program from chat
  const handleDeclineProgram = async (programId: string) => {
    setProcessingProgramId(programId);
    try {
      await declineProgram(programId);
      alert('Program Declined');
      loadGroupPrograms();
    } catch (error: any) {
      console.error('Error declining program:', error);
      alert(error?.response?.data?.message || 'Failed to decline program');
    } finally {
      setProcessingProgramId(null);
    }
  };

  // Helper to check if a message is a program announcement
  const isProgramMessage = (content: string) => {
    return content.startsWith('📋 New Group Program Created!');
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
    const member = program.members?.find(m => {
      const memberId = typeof m.user_id === 'string' ? m.user_id : m.user_id?._id;
      return memberId === currentUserId;
    });
    return member?.status || null;
  };

  const TabButton = ({
    title,
    tab,
    count,
  }: {
    title: string;
    tab: 'all' | 'direct' | 'groups';
    count: number;
  }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className="flex-1 py-3 text-center border-b-2 transition"
      style={{
        borderBottomColor: activeTab === tab ? theme.colors.primary : 'transparent',
        color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary,
        fontFamily: activeTab === tab ? theme.fonts.bodyBold : theme.fonts.body,
      }}
    >
      {title} ({count})
    </button>
  );

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: theme.colors.primary }}
          />
          <p style={{ color: theme.colors.textSecondary }}>Loading chats...</p>
        </div>
      </div>
    );
  }

  // Chat Room View
  if (selectedChat) {
    const chatName = getChatName(selectedChat);
    const avatar = getChatAvatar(selectedChat);

    return (
      <div className="h-screen flex overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showChatInfo ? 'border-r' : ''}`} style={{ borderColor: theme.colors.border }}>
          {/* Chat Header */}
          <div
            className="flex items-center gap-3 p-4 border-b flex-shrink-0"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          >
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 rounded-lg hover:opacity-80 transition"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: theme.colors.text }} />
            </button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: selectedChat.isGroupChat
                  ? theme.colors.primary + '20'
                  : theme.colors.secondary + '20',
              }}
            >
              {avatar ? (
                <img src={avatar} alt={chatName} className="w-10 h-10 rounded-full object-cover" />
              ) : selectedChat.isGroupChat ? (
                <Users className="w-5 h-5" style={{ color: theme.colors.primary }} />
              ) : (
                <User className="w-5 h-5" style={{ color: theme.colors.secondary }} />
              )}
            </div>
            <div className="flex-1">
              <h2
                className="font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                {chatName}
              </h2>
              {selectedChat.isGroupChat && (
                <p className="text-xs" style={{ color: theme.colors.textSecondary }}>
                  {selectedChat.users.length} members
                </p>
              )}
            </div>
            <button
              onClick={() => setShowChatInfo(!showChatInfo)}
              className="p-2 rounded-lg hover:opacity-80 transition"
            >
              <Info className="w-5 h-5" style={{ color: theme.colors.text }} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderColor: theme.colors.primary }}
                />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare className="w-12 h-12 mb-4" style={{ color: theme.colors.textTertiary }} />
                <p style={{ color: theme.colors.textSecondary }}>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isMine = message.sender._id === getCurrentUserId();
                const showDateSep = shouldShowDateSeparator(index);
                return (
                  <div key={message._id}>
                    {/* Date Separator */}
                    {showDateSep && (
                      <div className="flex items-center justify-center my-4">
                        <div 
                          className="px-3 py-1 rounded-full text-xs"
                          style={{ backgroundColor: theme.colors.surface, color: theme.colors.textSecondary }}
                        >
                          {formatDateSeparator(message.createdAt)}
                        </div>
                      </div>
                    )}

                    {/* Message */}
                    <div
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}
                      onContextMenu={(e) => handleMessageRightClick(e, message)}
                    >
                      {/* Profile Picture for group chat messages */}
                      {!isMine && selectedChat.isGroupChat && (
                        <div className="mr-2 flex-shrink-0">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: theme.colors.secondary + '20' }}
                          >
                            {message.sender.profilePicture ? (
                              <img 
                                src={message.sender.profilePicture} 
                                alt={message.sender.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                            )}
                          </div>
                        </div>
                      )}
                      <div className="relative max-w-[70%]">
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div 
                            className="text-xs px-3 py-1 mb-1 rounded-t-lg opacity-70 border-l-2"
                            style={{ 
                              backgroundColor: theme.colors.surface,
                              borderColor: theme.colors.primary,
                              color: theme.colors.textSecondary
                            }}
                          >
                            <Reply className="w-3 h-3 inline mr-1" />
                            {message.replyTo.content?.slice(0, 50)}...
                          </div>
                        )}

                        <div
                          className="rounded-2xl px-4 py-2 cursor-pointer hover:opacity-95 transition"
                          style={{
                            backgroundColor: isMine ? theme.colors.primary : theme.colors.surface,
                          }}
                        >
                          {!isMine && selectedChat.isGroupChat && (
                            <p
                              className="text-xs font-semibold mb-1"
                              style={{ color: theme.colors.primary }}
                            >
                              {message.sender.username}
                            </p>
                          )}
                          <p style={{ color: isMine ? '#FFFFFF' : theme.colors.text, whiteSpace: 'pre-line' }}>
                            {message.content}
                          </p>
                          <p
                            className="text-xs mt-1 text-right"
                            style={{ color: isMine ? 'rgba(255,255,255,0.7)' : theme.colors.textTertiary }}
                          >
                            {formatTime(message.createdAt)}
                            {isMine && message.readBy && message.readBy.length > 1 && (
                              <Check className="w-3 h-3 inline ml-1" />
                            )}
                          </p>
                        </div>

                        {/* Program Accept/Decline Buttons */}
                        {selectedChat.isGroupChat && !isMine && isProgramMessage(message.content) && (() => {
                          const programName = extractProgramName(message.content);
                          const program = programName ? findProgramByName(programName) : null;
                          const userStatus = program ? getUserProgramStatus(program) : null;

                          if (program && userStatus === 'pending') {
                            return (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleAcceptProgram(program._id)}
                                  disabled={processingProgramId === program._id}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                                  style={{
                                    backgroundColor: theme.colors.primary,
                                    color: '#FFFFFF',
                                  }}
                                >
                                  <Check className="w-4 h-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleDeclineProgram(program._id)}
                                  disabled={processingProgramId === program._id}
                                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                                  style={{
                                    backgroundColor: theme.colors.surface,
                                    color: theme.colors.text,
                                    border: `1px solid ${theme.colors.border}`,
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                  Decline
                                </button>
                              </div>
                            );
                          } else if (program && userStatus === 'accepted') {
                            return (
                              <div 
                                className="mt-2 px-3 py-2 rounded-lg text-sm text-center"
                                style={{
                                  backgroundColor: theme.colors.primary + '20',
                                  color: theme.colors.primary,
                                }}
                              >
                                ✓ Accepted
                              </div>
                            );
                          } else if (program && userStatus === 'declined') {
                            return (
                              <div 
                                className="mt-2 px-3 py-2 rounded-lg text-sm text-center"
                                style={{
                                  backgroundColor: theme.colors.surface,
                                  color: theme.colors.textSecondary,
                                }}
                              >
                                Declined
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {message.reactions.map((reaction, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: theme.colors.surface }}
                              >
                                {reaction.emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Preview */}
          {replyingTo && (
            <div 
              className="flex items-center gap-2 px-4 py-2 border-t flex-shrink-0"
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            >
              <Reply className="w-4 h-4" style={{ color: theme.colors.primary }} />
              <div className="flex-1">
                <p className="text-xs" style={{ color: theme.colors.primary }}>
                  Replying to {replyingTo.sender.username}
                </p>
                <p className="text-sm truncate" style={{ color: theme.colors.textSecondary }}>
                  {replyingTo.content}
                </p>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1">
                <X className="w-4 h-4" style={{ color: theme.colors.textSecondary }} />
              </button>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && messages.length === 0 && (
            <div 
              className="flex gap-2 px-4 py-2 overflow-x-auto border-t flex-shrink-0"
              style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
            >
              {SUGGESTED_MESSAGES.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setNewMessage(suggestion)}
                  className="flex-shrink-0 px-3 py-2 rounded-full text-sm transition hover:opacity-80"
                  style={{ 
                    backgroundColor: theme.colors.primary + '15',
                    color: theme.colors.primary
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Message Input */}
          <div
            className="flex items-center gap-3 p-4 border-t flex-shrink-0"
            style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
          >
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-2 rounded-lg hover:opacity-80 transition"
            >
              <Smile className="w-5 h-5" style={{ color: theme.colors.textSecondary }} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={replyingTo ? `Reply to ${replyingTo.sender.username}...` : "Type a message..."}
              className="flex-1 px-4 py-3 rounded-full outline-none"
              style={{
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="w-12 h-12 rounded-full flex items-center justify-center transition hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Chat Info Sidebar */}
        {showChatInfo && (
          <div className="w-80 flex flex-col" style={{ backgroundColor: theme.colors.surface }}>
            <div className="p-4 border-b" style={{ borderColor: theme.colors.border }}>
              <h3 
                className="text-lg font-semibold"
                style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
              >
                Chat Info
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-3">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: selectedChat.isGroupChat
                        ? theme.colors.primary + '20'
                        : theme.colors.secondary + '20',
                    }}
                  >
                    {avatar ? (
                      <img src={avatar} alt={chatName} className="w-20 h-20 rounded-full object-cover" />
                    ) : selectedChat.isGroupChat ? (
                      <Users className="w-10 h-10" style={{ color: theme.colors.primary }} />
                    ) : (
                      <User className="w-10 h-10" style={{ color: theme.colors.secondary }} />
                    )}
                  </div>
                  {/* Change Photo Button - Anyone can change for group chats */}
                  {selectedChat.isGroupChat && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updatingPhoto}
                      className="absolute bottom-0 right-0 p-2 rounded-full transition hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Change group photo"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChangeGroupPhoto}
                    className="hidden"
                  />
                </div>
                <h4 
                  className="font-semibold text-center"
                  style={{ color: theme.colors.text }}
                >
                  {chatName}
                </h4>
                {selectedChat.isGroupChat && (
                  <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                    {selectedChat.users.length} members
                  </p>
                )}
              </div>

              {/* Members List */}
              <div className="mb-6">
                <h5 
                  className="text-sm font-semibold mb-2"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {selectedChat.isGroupChat ? 'Members' : 'Participant'}
                </h5>
                <div className="space-y-2">
                  {selectedChat.users.map((member) => (
                    <div 
                      key={member._id}
                      className="flex items-center gap-3 p-2 rounded-lg"
                      style={{ backgroundColor: theme.colors.background }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.secondary + '20' }}
                      >
                        {member.profilePicture ? (
                          <img 
                            src={member.profilePicture} 
                            alt={member.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4" style={{ color: theme.colors.secondary }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: theme.colors.text }}>
                          {member.username}
                          {member._id === selectedChat.groupAdmin?._id && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.colors.primary + '20', color: theme.colors.primary }}>
                              Admin
                            </span>
                          )}
                        </p>
                      </div>
                      {/* Report User Button - hidden for current user */}
                      {member._id !== user?._id && (
                        <button
                          onClick={() => handleReport('user', member._id, member.username)}
                          className="p-1.5 rounded-full hover:opacity-70 transition"
                          style={{ backgroundColor: theme.colors.error + '10' }}
                          title="Report user"
                        >
                          <Flag className="w-3.5 h-3.5" style={{ color: theme.colors.error }} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedChat.isGroupChat && (
              <div className="p-4 border-t space-y-2" style={{ borderColor: theme.colors.border }}>
                {/* Create Group Program Button */}
                <button
                  onClick={() => setShowGroupProgramModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-80"
                  style={{
                    backgroundColor: theme.colors.primary + '20',
                    color: theme.colors.primary,
                  }}
                >
                  <Dumbbell className="w-4 h-4" />
                  Create Group Program
                </button>
                {/* Change Photo Button - Anyone can change */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updatingPhoto}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: theme.colors.secondary + '20',
                    color: theme.colors.secondary,
                  }}
                >
                  <Camera className="w-4 h-4" />
                  {updatingPhoto ? 'Updating...' : 'Change Photo'}
                </button>
                {/* Leave Group Button */}
                <button
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition hover:opacity-80 disabled:opacity-50"
                  style={{
                    backgroundColor: theme.colors.error + '20',
                    color: theme.colors.error,
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  {leavingGroup ? 'Leaving...' : 'Leave Group'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Message Options Modal */}
        {showMessageOptions && selectedMessage && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowMessageOptions(false);
                setSelectedMessage(null);
              }}
            />
            <div
              className="fixed z-50 rounded-lg shadow-lg overflow-hidden"
              style={{
                top: messageOptionsPosition.y,
                left: messageOptionsPosition.x,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              <button
                onClick={() => {
                  setShowReactionPicker(true);
                  setShowMessageOptions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:opacity-80 transition"
                style={{ color: theme.colors.text }}
              >
                <Smile className="w-4 h-4" />
                React
              </button>
              <button
                onClick={handleReply}
                className="flex items-center gap-3 w-full px-4 py-3 hover:opacity-80 transition"
                style={{ color: theme.colors.text }}
              >
                <Reply className="w-4 h-4" />
                Reply
              </button>
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-3 w-full px-4 py-3 hover:opacity-80 transition"
                style={{ color: theme.colors.text }}
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button
                onClick={handleReportMessage}
                className="flex items-center gap-3 w-full px-4 py-3 hover:opacity-80 transition"
                style={{ color: theme.colors.error }}
              >
                <Flag className="w-4 h-4" />
                Report
              </button>
            </div>
          </>
        )}

        {/* Reaction Picker */}
        {showReactionPicker && selectedMessage && (
          <>
            <div 
              className="fixed inset-0 z-40"
              onClick={() => {
                setShowReactionPicker(false);
                setSelectedMessage(null);
              }}
            />
            <div
              className="fixed z-50 rounded-full shadow-lg p-2 flex gap-1"
              style={{
                top: messageOptionsPosition.y,
                left: messageOptionsPosition.x,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:scale-110 transition"
                  style={{ backgroundColor: theme.colors.background }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Group Program Modal */}
        <GroupProgramModal
          visible={showGroupProgramModal}
          onClose={() => setShowGroupProgramModal(false)}
          groupId={selectedChat._id}
          groupName={chatName}
          onProgramCreated={() => {
            handleSelectChat(selectedChat);
            loadGroupPrograms();
          }}
        />
      </div>
    );
  }

  // Chat List View
  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background }}>
      <Header title="Messages" showBackButton showHomeButton />

      <div className="max-w-2xl mx-auto">
        {/* Search Bar */}
        <div className="p-4" style={{ backgroundColor: theme.colors.surface }}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: theme.colors.textTertiary }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition hover:opacity-80"
              style={{ backgroundColor: theme.colors.secondary }}
              title="Create Group"
            >
              <Users className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-12 h-12 rounded-xl flex items-center justify-center transition hover:opacity-80"
              style={{ backgroundColor: theme.colors.primary }}
              title="New Chat"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ backgroundColor: theme.colors.surface }}>
          <TabButton title="All" tab="all" count={chats.length} />
          <TabButton title="Direct" tab="direct" count={chats.filter((c) => !c.isGroupChat).length} />
          <TabButton title="Groups" tab="groups" count={chats.filter((c) => c.isGroupChat).length} />
        </div>

        {/* Chat List */}
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <MessageSquare className="w-16 h-16 mb-4" style={{ color: theme.colors.textTertiary }} />
            <h3
              className="text-lg font-semibold mb-2"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              No conversations
            </h3>
            <p
              className="text-center mb-4"
              style={{ fontFamily: theme.fonts.body, color: theme.colors.textSecondary }}
            >
              Start a new conversation by clicking the + button
            </p>
          </div>
        ) : (
          <div>
            {filteredChats.map((chat) => {
              const chatName = getChatName(chat);
              const avatar = getChatAvatar(chat);
              const latestMessage = chat.latestMessage?.content || 'No messages yet';
              const latestTime = chat.latestMessage?.createdAt
                ? formatTime(chat.latestMessage.createdAt)
                : '';

              return (
                <div
                  key={chat._id}
                  onClick={() => handleSelectChat(chat)}
                  className="flex items-center p-4 cursor-pointer transition hover:opacity-80 border-b"
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-3"
                    style={{
                      backgroundColor: chat.isGroupChat
                        ? theme.colors.primary + '20'
                        : theme.colors.secondary + '20',
                    }}
                  >
                    {avatar ? (
                      <img src={avatar} alt={chatName} className="w-12 h-12 rounded-full object-cover" />
                    ) : chat.isGroupChat ? (
                      <Users className="w-6 h-6" style={{ color: theme.colors.primary }} />
                    ) : (
                      <User className="w-6 h-6" style={{ color: theme.colors.secondary }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p
                        className="font-semibold truncate"
                        style={{
                          fontFamily: theme.fonts.bodyBold,
                          color: theme.colors.text,
                        }}
                      >
                        {chatName}
                      </p>
                      <span
                        className="text-xs ml-2 flex-shrink-0"
                        style={{ color: theme.colors.textTertiary }}
                      >
                        {latestTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {chat.isGroupChat && (
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: theme.colors.primary + '20',
                            color: theme.colors.primary,
                          }}
                        >
                          Group
                        </span>
                      )}
                      <p
                        className="text-sm truncate"
                        style={{
                          fontFamily: theme.fonts.body,
                          color: theme.colors.textSecondary,
                        }}
                      >
                        {latestMessage}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: theme.colors.overlay }}
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: theme.colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              Start New Chat
            </h2>
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: theme.colors.textTertiary }}
              />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searchingUsers ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: theme.colors.primary }} />
                </div>
              ) : searchResults.length === 0 && userSearchQuery ? (
                <p className="text-center py-4" style={{ color: theme.colors.textSecondary }}>
                  No users found
                </p>
              ) : (
                searchResults.map((targetUser) => (
                  <div
                    key={targetUser._id}
                    onClick={() => handleStartChat(targetUser)}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition"
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary + '20' }}
                    >
                      {targetUser.profilePicture ? (
                        <img
                          src={targetUser.profilePicture}
                          alt={targetUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: theme.colors.text }}>
                        {targetUser.username}
                      </p>
                      <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                        {targetUser.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="w-full mt-4 py-3 rounded-xl transition hover:opacity-90"
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: theme.colors.overlay }}
          onClick={() => setShowCreateGroupModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: theme.colors.card }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ fontFamily: theme.fonts.heading, color: theme.colors.text }}
            >
              Create Group Chat
            </h2>
            
            {/* Group Name Input */}
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full px-4 py-3 rounded-xl outline-none mb-4"
              style={{
                backgroundColor: theme.colors.input,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
              }}
            />

            {/* Selected Users */}
            {selectedGroupUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedGroupUsers.map((selectedUser) => (
                  <div
                    key={selectedUser._id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{ backgroundColor: theme.colors.primary + '20' }}
                  >
                    <span className="text-sm" style={{ color: theme.colors.primary }}>
                      {selectedUser.username}
                    </span>
                    <button
                      onClick={() => toggleUserForGroup(selectedUser)}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" style={{ color: theme.colors.primary }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Users */}
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: theme.colors.textTertiary }}
              />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => handleSearchUsers(e.target.value)}
                placeholder="Search users to add..."
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: theme.colors.input,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              />
            </div>

            {/* User Search Results */}
            <div className="max-h-48 overflow-y-auto mb-4">
              {searchingUsers ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="w-6 h-6 animate-spin" style={{ color: theme.colors.primary }} />
                </div>
              ) : searchResults.length === 0 && userSearchQuery ? (
                <p className="text-center py-4" style={{ color: theme.colors.textSecondary }}>
                  No users found
                </p>
              ) : (
                searchResults.map((targetUser) => {
                  const isSelected = selectedGroupUsers.some((u) => u._id === targetUser._id);
                  return (
                    <div
                      key={targetUser._id}
                      onClick={() => toggleUserForGroup(targetUser)}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition mb-2"
                      style={{ backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.surface }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: theme.colors.primary + '20' }}
                      >
                        {targetUser.profilePicture ? (
                          <img
                            src={targetUser.profilePicture}
                            alt={targetUser.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" style={{ color: theme.colors.primary }} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: theme.colors.text }}>
                          {targetUser.username}
                        </p>
                        <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                          {targetUser.email}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-5 h-5" style={{ color: theme.colors.primary }} />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Info Text */}
            <p className="text-xs mb-4" style={{ color: theme.colors.textTertiary }}>
              Add at least 2 members to create a group
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setGroupName('');
                  setSelectedGroupUsers([]);
                  setUserSearchQuery('');
                  setSearchResults([]);
                }}
                className="flex-1 py-3 rounded-xl transition hover:opacity-90"
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup || !groupName.trim() || selectedGroupUsers.length < 2}
                className="flex-1 py-3 rounded-xl transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  color: '#FFFFFF',
                }}
              >
                {creatingGroup ? (
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
