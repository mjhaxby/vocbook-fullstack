import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

// Interceptor to set withCredentials and CSRF only for specific requests
api.interceptors.request.use(config => {
  // Example: Only set withCredentials and CSRF for session-auth endpoints
  const needsSession = !config.url.startsWith('/api/token/') && !config.url.startsWith('/token/') && !config.url.startsWith('/api/auth/');
  if (needsSession) {
    config.withCredentials = true;
    config.xsrfCookieName = 'csrftoken';
    config.xsrfHeaderName = 'X-CSRFToken';
  }
  return config;
});

export default api;