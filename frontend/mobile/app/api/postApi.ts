import axiosInstance from "./axiosInstance";
import { tokenStorage } from "../../utils/tokenStorage";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const postApi = {
    createPost: async (
        content: string,
        reference?: { item_id: string; item_type: "GeoSession" | "ProgramSession" | "FoodLog" | "Post" },
        title?: string,
        images?: string[], // Array of local URIs
        visibility?: "public" | "friends" | "private",
        tags?: string[]
    ) => {
        try {
            console.log('[postApi] Creating post with:', { content, reference, title, visibility, tags, imageCount: images?.length });

            // If no images, use simple JSON request via axios (more reliable)
            if (!images || images.length === 0) {
                console.log('[postApi] No images, using JSON request...');
                const { data } = await axiosInstance.post("/posts", {
                    content,
                    title: title || undefined,
                    visibility: visibility || "public",
                    reference: reference || undefined,
                    tags: tags || []
                });
                console.log('[postApi] Post created successfully:', data);
                return data;
            }

            // With images, use native fetch API (works better with FormData in React Native)
            console.log('[postApi] Has images, using fetch with FormData...');
            const formData = new FormData();
            formData.append("content", content);
            if (title) formData.append("title", title);
            if (visibility) formData.append("visibility", visibility);
            if (reference) formData.append("reference", JSON.stringify(reference));
            if (tags && tags.length > 0) {
                formData.append("tags", JSON.stringify(tags));
            }

            // Append images
            console.log('[postApi] Adding images to FormData...');
            for (let i = 0; i < images.length; i++) {
                const imageUri = images[i];
                console.log(`[postApi] Processing image ${i + 1}/${images.length}:`, imageUri);

                const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('images', {
                    uri: imageUri,
                    type: type,
                    name: filename,
                } as any);
            }
            console.log('[postApi] Images added to FormData');

            // Get auth token
            const token = await tokenStorage.getToken();
            console.log('[postApi] Sending fetch request to:', `${API_URL}/posts`);

            // Use native fetch - it handles FormData better in React Native
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    // DO NOT set Content-Type - fetch will set it automatically with boundary
                },
                body: formData,
            });

            console.log('[postApi] Fetch response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('[postApi] Fetch error response:', errorData);
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[postApi] Post created successfully:', data);
            return data;
        } catch (error: any) {
            console.error('[postApi] Error creating post:', error);
            console.error('[postApi] Error message:', error.message);
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

    updatePost: async (
        postId: string,
        updates: {
            content?: string;
            title?: string;
            visibility?: "public" | "friends" | "private";
            images?: string[]; // Array of local URIs for new images
            keepImages?: string[]; // Array of remote URLs to keep
            tags?: string[];
        }
    ) => {
        try {
            console.log(`[postApi] Updating post ${postId} with:`, updates);

            // Check if we have new images to upload
            const hasNewImages = updates.images && updates.images.length > 0;

            if (!hasNewImages) {
                // simple JSON update
                console.log('[postApi] No new images, using JSON update...');
                const { data } = await axiosInstance.put(`/posts/${postId}`, {
                    content: updates.content,
                    title: updates.title,
                    visibility: updates.visibility,
                    keepImages: updates.keepImages,
                    tags: updates.tags
                });
                return data;
            }

            // Multipart update
            console.log('[postApi] Has new images, using fetch with FormData...');
            const formData = new FormData();
            if (updates.content !== undefined) formData.append("content", updates.content);
            if (updates.title !== undefined) formData.append("title", updates.title);
            if (updates.visibility !== undefined) formData.append("visibility", updates.visibility);
            if (updates.tags && updates.tags.length > 0) {
                formData.append("tags", JSON.stringify(updates.tags));
            }

            // Handle existing images to keep
            if (updates.keepImages) {
                updates.keepImages.forEach(img => formData.append("keepImages[]", img));
            }

            // Append new images
            for (let i = 0; i < (updates.images || []).length; i++) {
                const imageUri = updates.images![i];
                const filename = imageUri.split('/').pop() || `image_${i}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('images', {
                    uri: imageUri,
                    type: type,
                    name: filename,
                } as any);
            }

            const token = await tokenStorage.getToken();
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error: any) {
            console.error('[postApi] Error updating post:', error);
            throw error;
        }
    },
};

export default postApi;
