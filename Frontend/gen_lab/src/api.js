import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

export const registerUser = (data) => api.post('/register', data).then((r) => r.data);
export const loginUser = (data) => api.post('/login', data).then((r) => r.data);
export const fetchUsers = () => api.get('/api/users').then((r) => r.data);

export const fetchTasks = () => api.get('/api/tasks').then((r) => r.data);
export const createTask = (data) => api.post('/api/tasks', data).then((r) => r.data);
export const updateTask = (id, data) => api.put(`/api/tasks/${id}`, data).then((r) => r.data);
export const deleteTask = (id) => api.delete(`/api/tasks/${id}`).then((r) => r.data);

export const fetchStats = () => api.get('/api/stats').then((r) => r.data);

export default api;
