import axiosInstance from "./axiosInstance";

export const postApi = {
    createPost: async (
        content: string,
        reference?: { item_id: string; item_type: "GeoSession" | "ProgramSession" | "FoodLog" | "Post" },
        title?: string,
        images?: string[], // Array of local URIs
        visibility?: "public" | "friends" | "private"
    ) => {
        try {
            console.log('[postApi] Creating post with:', { content, reference, title, visibility, imageCount: images?.length });

            const formData = new FormData();
            formData.append("content", content);
            if (title) formData.append("title", title);
            if (visibility) formData.append("visibility", visibility);
            if (reference) formData.append("reference", JSON.stringify(reference));

            // Append images if provided
            if (images && images.length > 0) {
                console.log('[postApi] Adding images to FormData...');
                for (let i = 0; i < images.length; i++) {
                    const imageUri = images[i];
                    console.log(`[postApi] Processing image ${i + 1}/${images.length}:`, imageUri);

                    // For React Native, we need to create a proper file object
                    const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : 'image/jpeg';

                    // React Native requires this specific format
                    formData.append('images', {
                        uri: imageUri,
                        type: type,
                        name: filename,
                    } as any);
                }
                console.log('[postApi] Images added to FormData');
            }

            console.log('[postApi] Sending request...');
            const { data } = await axiosInstance.post("/posts", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 30000, // 30 second timeout
            });
            console.log('[postApi] Post created successfully:', data);
            return data;
        } catch (error: any) {
            console.error('[postApi] Error creating post:', error);
            console.error('[postApi] Error response:', error.response?.data);
            console.error('[postApi] Error status:', error.response?.status);
            throw error;
        }
    },

    getFeed: async (page: number = 1, limit: number = 20) => {
        const { data } = await axiosInstance.get("/posts", {
            params: { page, limit },
        });
        return data;
    },

    likePost: async (postId: string, reactionType: string = "Like") => {
        const { data } = await axiosInstance.put(`/posts/${postId}/react`, {
            reactionType,
        });
        return data;
    },

    votePost: async (postId: string, voteType: "up" | "down") => {
        const { data } = await axiosInstance.put(`/posts/${postId}/vote`, {
            voteType,
        });
        return data;
    },

    deletePost: async (postId: string) => {
        const { data } = await axiosInstance.delete(`/posts/${postId}`);
        return data;
    },
};

export default postApi;
