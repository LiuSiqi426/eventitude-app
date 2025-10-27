// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3333/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false, // 🔥 重要：设置为false
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器，自动添加token
api.interceptors.request.use((config) => {
  console.log('🚀 发送请求到:', config.url);
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理通用错误
api.interceptors.response.use(
  (response) => {
    console.log('✅ API响应成功:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API请求失败:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: (userId) => api.get(`/users/${userId}`), // 修改：需要用户ID参数
};

export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userId, data) => api.patch(`/users/${userId}`, data),
  getAllUsers: () => api.get('/users'), // 获取所有用户
  getOrganizers: () => api.get('/organizers'), // 获取组织者
};

export const eventsAPI = {
  getAll: () => api.get('/events'),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.patch(`/events/${id}`, eventData), // 修改：使用patch
  delete: (id) => api.delete(`/events/${id}`),
  search: (query) => api.get(`/events/search/${query}`),
  getEventsByOrganizer: (organizerId) => api.get(`/events/organizer/${organizerId}`),
  getCategories: () => api.get('/categories'), // 获取分类
};

export const questionsAPI = {
  getByEvent: (eventId) => api.get(`/events/${eventId}/questions`),
  create: (eventId, questionData) => api.post(`/events/${eventId}/questions`, questionData),
  update: (questionId, questionData) => api.patch(`/questions/${questionId}`, questionData),
  delete: (questionId) => api.delete(`/questions/${questionId}`),
  upvote: (questionId) => api.post(`/questions/${questionId}/upvote`),
};

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (categoryData) => api.post('/categories', categoryData),
};

export default api;