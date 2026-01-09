import axiosInstance from './axiosInstance';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  profilePicture: string | null;
}

export interface MessageReaction {
  user: User | string;
  emoji: string;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  chat: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  reactions?: MessageReaction[];
  replyTo?: Message;
  isReported?: boolean;
}

export interface Chat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: User[];
  latestMessage?: Message;
  groupAdmin?: User;
  groupPhoto?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupChatData {
  name: string;
  users: string[];
}

// Chat API Functions

// Get all chats for the current user
export const fetchChats = async (): Promise<Chat[]> => {
  const response = await axiosInstance.get('/chat');
  return response.data;
};

// Access or create a 1-on-1 chat with a user
export const accessChat = async (userId: string): Promise<Chat> => {
  const response = await axiosInstance.post('/chat', { userId });
  return response.data;
};

// Create a new group chat
export const createGroupChat = async (data: CreateGroupChatData): Promise<Chat> => {
  const response = await axiosInstance.post('/chat/group', {
    name: data.name,
    users: JSON.stringify(data.users),
  });
  return response.data;
};

// Rename a group chat
export const renameGroupChat = async (chatId: string, chatName: string): Promise<Chat> => {
  const response = await axiosInstance.put('/chat/rename', { chatId, chatName });
  return response.data;
};

// Add a user to a group chat
export const addUserToGroup = async (chatId: string, userId: string): Promise<Chat> => {
  const response = await axiosInstance.put('/chat/groupadd', { chatId, userId });
  return response.data;
};

// Remove a user from a group chat
export const removeUserFromGroup = async (chatId: string, userId: string): Promise<Chat> => {
  const response = await axiosInstance.put('/chat/groupremove', { chatId, userId });
  return response.data;
};

// Update group photo
export const updateGroupPhoto = async (chatId: string, groupPhoto: string): Promise<Chat> => {
  const response = await axiosInstance.put('/chat/groupphoto', { chatId, groupPhoto });
  return response.data;
};

// Message API Functions

// Get all messages for a chat
export const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const response = await axiosInstance.get(`/message/${chatId}`);
  return response.data;
};

// Send a new message
export const sendMessage = async (
  content: string,
  chatId: string,
  replyTo?: string
): Promise<Message> => {
  const response = await axiosInstance.post('/message', { content, chatId, replyTo });
  return response.data;
};

// Add a reaction to a message
export const addReaction = async (messageId: string, emoji: string): Promise<Message> => {
  const response = await axiosInstance.put(`/message/${messageId}/react`, { emoji });
  return response.data;
};

// Report a message
export const reportMessage = async (messageId: string, reason?: string): Promise<void> => {
  await axiosInstance.put(`/message/${messageId}/report`, { reason });
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string): Promise<void> => {
  await axiosInstance.put(`/message/${chatId}/read`);
};

// Search users for starting a new chat
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await axiosInstance.get(`/users/search?search=${query}`);
  return response.data;
};

// Get all users (for group chat creation)
export const getAllUsers = async (): Promise<User[]> => {
  const response = await axiosInstance.get('/users/all');
  return response.data;
};

export default {
  fetchChats,
  accessChat,
  createGroupChat,
  renameGroupChat,
  addUserToGroup,
  removeUserFromGroup,
  updateGroupPhoto,
  fetchMessages,
  sendMessage,
  addReaction,
  reportMessage,
  markMessagesAsRead,
  searchUsers,
  getAllUsers,
};
