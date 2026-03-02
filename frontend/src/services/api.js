import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Users
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
};

// Groups
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  addMember: (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`),
};

// Decisions
export const decisionsAPI = {
  getGroupDecisions: (groupId) => api.get(`/decisions/group/${groupId}`),
  getById: (id) => api.get(`/decisions/${id}`),
  create: (data) => api.post('/decisions', data),
  addAlternative: (decisionId, data) => api.post(`/decisions/${decisionId}/alternatives`, data),
  submitVote: (decisionId, rankings) => api.post(`/decisions/${decisionId}/vote`, { rankings }),
  calculateResults: (decisionId, method = 'all') => 
    api.post(`/decisions/${decisionId}/calculate?method=${method}`),
  complete: (decisionId) => api.put(`/decisions/${decisionId}/complete`),
  delete: (decisionId) => api.delete(`/decisions/${decisionId}`),
};

export default api;
