import axios from 'axios';

// Relative base URL: works with the Vite proxy in dev and same-origin in production
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export default api;