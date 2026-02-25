import axiosInstance from './axiosInstance';

export interface ProfilePost {
  _id: string;
  title: string;
  content: string;
  images: string[];
  thumbnail: string | null;
  createdAt: string;
  visibility: string;
  commentCount: number;
  reactionCount: number;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  reactions: Array<{
    user: string;
    type: string;
  }>;
  reference?: {
    item_id: any;
    item_type: string;
  };
}

export interface PublicProfile {
  id: string;
  username: string;
  profilePicture?: string;
  bio: string;
  isPrivate: boolean;
  privacyMessage?: string;
  followersCount: number;
  followingCount: number;
  postCount: number;
  posts: ProfilePost[];
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  isOwnProfile: boolean;
  registeredDate?: string;
  gamification?: {
    points: number;
    coins: number;
  };
}

export interface FollowUser {
  _id: string;
  username: string;
  profilePicture?: string;
  bio?: string;
}

export const profileApi = {
  getPublicProfile: async (userId: string): Promise<PublicProfile> => {
    const response = await axiosInstance.get(`/profile/${userId}`);
    return response.data.profile;
  },

  followUser: async (userId: string) => {
    const response = await axiosInstance.post(`/profile/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId: string) => {
    const response = await axiosInstance.delete(`/profile/${userId}/follow`);
    return response.data;
  },

  getFollowers: async (userId: string): Promise<FollowUser[]> => {
    const response = await axiosInstance.get(`/profile/${userId}/followers`);
    return response.data.followers;
  },

  getFollowing: async (userId: string): Promise<FollowUser[]> => {
    const response = await axiosInstance.get(`/profile/${userId}/following`);
    return response.data.following;
  },

  updateProfileVisibility: async (visibility: 'public' | 'mutuals' | 'hidden') => {
    const response = await axiosInstance.patch('/profile/visibility', { visibility });
    return response.data;
  },

  updateBio: async (bio: string) => {
    const response = await axiosInstance.patch('/profile/bio', { bio });
    return response.data;
  },
};
