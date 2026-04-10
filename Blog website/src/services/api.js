// src/services/api.js
import axios from 'axios';

// Use environment variable, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

console.log('API Base URL:', api.defaults.baseURL);

export default api;