import axios from 'axios';

// Pointing to our FastAPI backend!
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Increased to 15s to allow for Vercel serverless cold-starts
});

api.interceptors.request.use((config) => {
  // Use the standard 'token' key since that's what we are setting in Login
  const token = localStorage.getItem('token') || localStorage.getItem('transitops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto-logout if token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('transitops_token');
      window.location.href = '/'; // Kick back to login
    }
    return Promise.reject(error);
  }
);

export default api;
