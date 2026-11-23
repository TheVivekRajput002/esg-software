import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('esg_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const selectedOrgId = localStorage.getItem('esg_selected_org');
    if (selectedOrgId) {
      config.headers['x-organization-id'] = selectedOrgId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not already on login page, clear token
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('esg_token');
        localStorage.removeItem('esg_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
