import axiosInstance from './axiosInstance';

export interface Post {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  title: string;
  content: string;
  images: string[];
  comments?: any[];
  commentCount?: number;
  shares?: any[];
  createdAt: string;
  visibility: string;
  reference?: {
    item_id: any;
    item_type: string;
  };
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  reactions: Array<{
    user: string;
    type: string;
  }>;
  score?: number;
}

export const postApi = {
  createPost: async (
    content: string,
    reference?: { item_id: string; item_type: 'GeoSession' | 'ProgramSession' | 'FoodLog' | 'Post' },
    title?: string,
    images?: File[],
    visibility?: 'public' | 'friends' | 'private'
  ) => {
    try {
      console.log('[postApi] Creating post with:', { content, reference, title, visibility, imageCount: images?.length });

      const formData = new FormData();
      formData.append('content', content);
      if (title) formData.append('title', title);
      if (visibility) formData.append('visibility', visibility);
      if (reference) formData.append('reference', JSON.stringify(reference));

      // Append images if provided
      if (images && images.length > 0) {
        console.log('[postApi] Adding images to FormData...');
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]);
        }
        console.log('[postApi] Images added to FormData');
      }

      console.log('[postApi] Sending request...');
      const { data } = await axiosInstance.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      console.log('[postApi] Post created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('[postApi] Error creating post:', error);
      console.error('[postApi] Error response:', error.response?.data);
      throw error;
    }
  },

  getFeed: async (page: number = 1, limit: number = 20): Promise<Post[]> => {
    const { data } = await axiosInstance.get('/posts', {
      params: { page, limit },
    });
    return data;
  },

  getPost: async (postId: string): Promise<Post> => {
    const { data } = await axiosInstance.get(`/posts/${postId}`);
    return data;
  },

  likePost: async (postId: string, reactionType: string = 'Like') => {
    const { data } = await axiosInstance.put(`/posts/${postId}/react`, {
      reactionType,
    });
    return data;
  },

  votePost: async (postId: string, voteType: 'up' | 'down') => {
    const { data } = await axiosInstance.put(`/posts/${postId}/vote`, {
      voteType,
    });
    return data;
  },

  deletePost: async (postId: string) => {
    const { data } = await axiosInstance.delete(`/posts/${postId}`);
    return data;
  },

  updatePost: async (
    postId: string,
    updates: {
      content?: string;
      title?: string;
      visibility?: 'public' | 'friends' | 'private';
      images?: File[];
      keepImages?: string[];
    }
  ) => {
    try {
      console.log(`[postApi] Updating post ${postId} with:`, updates);

      const hasNewImages = updates.images && updates.images.length > 0;

      if (!hasNewImages) {
        console.log('[postApi] No new images, using JSON update...');
        const { data } = await axiosInstance.put(`/posts/${postId}`, {
          content: updates.content,
          title: updates.title,
          visibility: updates.visibility,
          keepImages: updates.keepImages,
        });
        return data;
      }

      console.log('[postApi] Has new images, using FormData...');
      const formData = new FormData();
      if (updates.content !== undefined) formData.append('content', updates.content);
      if (updates.title !== undefined) formData.append('title', updates.title);
      if (updates.visibility !== undefined) formData.append('visibility', updates.visibility);

      if (updates.keepImages) {
        updates.keepImages.forEach((img) => formData.append('keepImages[]', img));
      }

      for (let i = 0; i < (updates.images || []).length; i++) {
        formData.append('images', updates.images![i]);
      }

      const { data } = await axiosInstance.put(`/posts/${postId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      return data;
    } catch (error: any) {
      console.error('[postApi] Error updating post:', error);
      throw error;
    }
  },
};

export default postApi;
