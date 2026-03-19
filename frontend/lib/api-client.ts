import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const IntegrationAPI = {
  getSchemas: async () => {
    const response = await apiClient.get('/schema-registry');
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