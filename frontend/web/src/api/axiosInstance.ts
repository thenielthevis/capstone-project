import axios from 'axios';
import { getToken } from '../utils/auth';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[axiosInstance] Request to:', config.url, 'with token:', token.substring(0, 20) + '...');
    } else {
      console.warn('[axiosInstance] Request to:', config.url, 'without token!');
    }
    return config;
  },
  (error) => {
    console.error('[axiosInstance] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('[axiosInstance] Response from:', response.config.url, 'status:', response.status);
    return response;
  },
  (error) => {
    console.error('[axiosInstance] Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn('[axiosInstance] 401 Unauthorized - clearing auth and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
