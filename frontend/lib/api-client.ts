import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const AuthAPI = {
  login: async (credentials: any) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  }
};

export const IntegrationAPI = {
  getSchemas: async () => {
    const response = await apiClient.get('/schema-registry');
    return response.data;
  },

  resolveSchema: async (tableName: string) => {
    const response = await apiClient.put(`/schema-registry/${tableName}/resolve`);
    return response.data;
  },
  
  getLogs: async () => {
    const response = await apiClient.get('/event-logs');
    return response.data;
  },

  triggerFullSync: async () => {
    const response = await apiClient.post('/integration/run-full-sync');
    return response.data;
  }
};