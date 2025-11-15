import axios, { AxiosHeaders } from 'axios';
import { tokenStorage } from "../../utils/tokenStorage";
import { useRouter } from "expo-router";

const router = useRouter();
const axiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api", // adjust as needed
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optionally, add interceptors for auth tokens
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getToken();
    if (token) {
      // Axios v1+ always provides AxiosHeaders instance
      (config.headers as any)["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
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
          // Refresh failed, log out user
          // await tokenStorage.removeToken();
          // await tokenStorage.removeRefreshToken();
          // Optionally redirect to login
          // router.replace("/screens/auth/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;