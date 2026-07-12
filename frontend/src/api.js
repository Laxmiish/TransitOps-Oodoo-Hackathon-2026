// frontend/src/api.js

// The backend URL is pulled from the .env file
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * A custom fetch wrapper that automatically attaches the JWT token
 * to every request made to the backend.
 */
export const apiFetch = async (endpoint, options = {}) => {
  // Grab the JWT token securely from localStorage
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // Auto-inject token if it exists
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      console.error("Unauthorized: token expired or invalid. You should log out the user here.");
      // Optional: localStorage.removeItem('token'); window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'API request failed');
  }

  return response.json();
};

// Convenience methods so you don't have to specify the method manually
export const api = {
  get: (endpoint) => apiFetch(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
};
