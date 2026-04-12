import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  },

  triggerCustomSync: async (tables: string[]) => {
    const response = await apiClient.post('/integration/run-custom-sync', { tables });
    return response.data
  }
};

export const JobAPI = {
  getJobs: async () => (await apiClient.get('/jobs')).data,
  createJob: async (data: any) => (await apiClient.post('/jobs', data)).data,
  updateJob: async (id: string, data: any) => (await apiClient.put(`/jobs/${id}`, data)).data,
  toggleJob: async (id: string, isActive: boolean) => (await apiClient.put(`/jobs/${id}/toggle`, { isActive })).data,
  triggerJob: async (id: string) => (await apiClient.post(`/jobs/${id}/trigger`)).data,
};

export type RoleType = 'admin' | 'reader' | 'writer' | 'user';

export type RoleSummary = {
  id: number;
  roleName: string;
  type: RoleType;
  tablePatterns: string[];
  description?: string;
};

export type UserPermissionSummary = {
  userId: number;
  username: string;
  email: string;
  role: RoleSummary | null;
};

export const AccessControlAPI = {
  getUsersPermissionSummary: async (): Promise<UserPermissionSummary[]> => {
    return (await apiClient.get('/users/permissions')).data;
  },

  getRoles: async (): Promise<RoleSummary[]> => {
    return (await apiClient.get('/roles')).data;
  },

  assignRole: async (userId: number, roleId: number) => {
    return (await apiClient.put(`/users/${userId}/role`, { roleId })).data;
  },

  updateTablePatterns: async (userId: number, tablePatterns: string[]) => {
    return (await apiClient.post(`/users/${userId}/permissions`, { tablePatterns })).data;
  },
};