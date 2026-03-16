import axiosInstance from "./axiosInstance";

// Types
export interface PublicProfile {
    id: string;
    username: string;
    profilePicture: string | null;
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
    } | null;
    transformation: {
        before: string | null;
        after: string | null;
    } | null;
    achievementsCount: number;
}

export interface ProfilePost {
    _id: string;
    user: {
        _id: string;
        username: string;
        profilePicture?: string;
    };
    title: string;
    content: string;
    images: string[];
    tags?: string[];
    visibility: string;
    votes: {
        upvotes: string[];
        downvotes: string[];
    };
    reactions: Array<{ user: string; type: string }>;
    reference?: {
        item_id: any;
        item_type: string;
    };
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    reactionCount: number;
    thumbnail: string | null;
}

export interface FollowUser {
    _id: string;
    username: string;
    profilePicture: string | null;
    bio: string;
}

// Get public profile of a user
export const getPublicProfile = async (userId: string): Promise<PublicProfile> => {
    const response = await axiosInstance.get(`/profile/${userId}`);
    return response.data.profile;
};

// Follow a user
export const followUser = async (userId: string) => {
    const response = await axiosInstance.post(`/profile/${userId}/follow`);
    return response.data;
};

// Unfollow a user
export const unfollowUser = async (userId: string) => {
    const response = await axiosInstance.delete(`/profile/${userId}/follow`);
    return response.data;
};

// Get followers list
export const getFollowers = async (userId: string): Promise<FollowUser[]> => {
    const response = await axiosInstance.get(`/profile/${userId}/followers`);
    return response.data.followers;
};

// Get following list
export const getFollowing = async (userId: string): Promise<FollowUser[]> => {
    const response = await axiosInstance.get(`/profile/${userId}/following`);
    return response.data.following;
};

// Update profile visibility
export const updateProfileVisibility = async (visibility: 'public' | 'mutuals' | 'hidden') => {
    const response = await axiosInstance.patch('/profile/visibility', { visibility });
    return response.data;
};

// Update bio
export const updateBio = async (bio: string) => {
    const response = await axiosInstance.patch('/profile/bio', { bio });
    return response.data;
};

// Update transformation pictures
export const updateTransformation = async (before?: string | null, after?: string | null) => {
    const response = await axiosInstance.put("/profile/transformation", { before, after });
    return response.data;
};

// Get user achievements
export const getUserAchievements = async (userId: string) => {
    const response = await axiosInstance.get(`/profile/${userId}/achievements`);
    return response.data;
};
