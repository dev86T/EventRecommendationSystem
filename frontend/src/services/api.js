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
  findByCode: (code) => api.get(`/users/by-code/${code}`),
};

// Groups
export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getById: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  addMember: (groupId, userCode) => api.post(`/groups/${groupId}/members`, { userCode }),
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
  updateDecision: (id, data) => api.put(`/decisions/${id}`, data),
  updateAlternative: (decisionId, altId, data) => api.put(`/decisions/${decisionId}/alternatives/${altId}`, data),
  complete: (decisionId) => api.put(`/decisions/${decisionId}/complete`),
  deleteDecision: (decisionId) => api.delete(`/decisions/${decisionId}`),
};

// Profile
export const profileAPI = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  requestEmailChange: (data) => api.post('/users/me/email/request', data),
  confirmEmailChange: (data) => api.post('/users/me/email/confirm', data),
};

export default api;
