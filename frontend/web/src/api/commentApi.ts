import axiosInstance from "./axiosInstance";

export interface Comment {
  _id: string;
  user: {
    _id: string;
    username?: string;
    name?: string;
    profilePicture?: string;
  };
  content: string;
  parentComment: string | null;
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  reactions: Array<{
    user: string;
    type: string;
  }>;
  createdAt: string;
}

export const commentApi = {
  // Create a new comment
  createComment: async (postId: string, content: string, parentCommentId?: string) => {
    const { data } = await axiosInstance.post("/comments", {
      postId,
      content,
      parentCommentId: parentCommentId || null,
    });
    return data;
  },

  // Get all comments for a post
  getCommentsByPost: async (postId: string, page: number = 1, limit: number = 50) => {
    const { data } = await axiosInstance.get(`/comments/${postId}`, {
      params: { page, limit },
    });
    return data;
  },

  // Vote on a comment
  voteComment: async (commentId: string, voteType: "up" | "down") => {
    const { data } = await axiosInstance.put(`/comments/${commentId}/vote`, {
      voteType,
    });
    return data;
  },

  // React to a comment
  reactComment: async (commentId: string, reactionType: string = "Like") => {
    const { data } = await axiosInstance.put(`/comments/${commentId}/react`, {
      reactionType,
    });
    return data;
  },

  // Delete a comment
  deleteComment: async (commentId: string) => {
    const { data } = await axiosInstance.delete(`/comments/${commentId}`);
    return data;
  },
};

export default commentApi;
