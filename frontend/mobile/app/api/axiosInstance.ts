import axios, { AxiosHeaders } from 'axios';
import { tokenStorage } from "../../utils/tokenStorage";
import { router } from "expo-router";

// Get API URL from environment variable
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

console.log('[axiosInstance] Initializing with baseURL:', API_URL);

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increased to 60 seconds for image uploads
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for auth tokens and logging
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();
    if (token) {
      // Axios v1+ always provides AxiosHeaders instance
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    console.log(`[axios] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[axios] Request error:', error.message);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[axios] Response ${response.status} from ${response.config.url}`);
    return response;
  },
  async (error) => {
    // Log detailed error information
    if (error.response) {
      console.error(`[axios] Response error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[axios] Network error - no response received');
      console.error('[axios] Request config:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method
      });
    } else {
      console.error('[axios] Error:', error.message);
    }

    const originalRequest = error.config;
    
    // Handle token refresh for 401 errors
    if (
      error.response?.status === 401 &&
      error.response?.data?.message === "jwt expired" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const res = await axiosInstance.post("/users/refresh-token", { refreshToken });
          const newToken = res.data.token;
          await tokenStorage.saveToken(newToken);
          // Set header correctly for retry
          if (originalRequest.headers && typeof originalRequest.headers.set === "function") {
            originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          } else {
            originalRequest.headers = {
              ...originalRequest.headers,
              Authorization: `Bearer ${newToken}`,
            };
          }
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('[axios] Token refresh failed:', refreshError);
          await tokenStorage.removeToken();
          await tokenStorage.removeRefreshToken();
          // Redirect to login
          try {
            router.replace("/screens/auth/login");
          } catch (routerError) {
            console.error('[axios] Router navigation failed:', routerError);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;