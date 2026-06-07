import axios from 'axios';
import { clearAuthSession } from '@/lib/auth-session';

const API_URL = process.env.NEXT_PUBLIC_KONG_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    const requestUrl = config.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh-token');

    if (token && !isAuthRequest) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestUrl = error.config?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

      if (status === 401 && !isAuthRequest) {
        clearAuthSession();

        if (window.location.pathname !== '/login') {
          window.location.href = '/login?reason=expired';
        }
      }
    }

    return Promise.reject(error);
  },
);

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

  resolveSchema: async (tableName: string, sql?: string) => {
    const response = await apiClient.put(`/schema-registry/${tableName}/resolve`, { sql });
    return response.data;
  },

  rejectSchema: async (tableName: string) => {
    const response = await apiClient.put(`/schema-registry/${tableName}/reject`);
  },

  updateSyncStrategy: async (tableName: string, strategy: 'upsert' | 'overwrite' | 'incremental') => {
    const response = await apiClient.patch(`/schema-registry/${tableName}/strategy`, { strategy });
    return response.data;
  },
  
  getLogs: async () => {
    const response = await apiClient.get('/event-logs?type=sync');
    return response.data;
  },

  triggerFullSync: async (jobName?: string) => {
    const response = await apiClient.post('/integration/run-full-sync', { jobName });
    return response.data;
  },

  triggerCustomSync: async (tables: string[], jobName?: string) => {
    const response = await apiClient.post('/integration/run-custom-sync', { tables, jobName });
    return response.data;
  },

  scanOrphans: async (tables: string[]): Promise<Array<{
    tableName: string;
    primaryKey: string;
    orphanCount: number;
    orphanIds: unknown[];
    error?: string;
  }>> => {
    const response = await apiClient.post('/integration/scan-orphans', { tables });
    return response.data;
  },

  purgeOrphans: async (tableName: string, primaryKey: string, ids: unknown[]): Promise<{ deleted: number }> => {
    const response = await apiClient.post('/integration/purge-orphans', { tableName, primaryKey, ids });
    return response.data;
  },

  previewMigration: async (tableName: string) => {
    const res = await apiClient.get(`/schema-registry/preview-sql/${tableName}`);
    return res.data.sql;
  },
};

export const BackupAPI = {
  listBackups: async (prefix?: string) => {
    const response = await apiClient.get('/backup/list', {
      params: prefix ? { prefix } : undefined,
    });

    return response.data;
  },

  triggerBackup: async (tables?: string[]) => {
    const response = await apiClient.post('/backup/trigger', {
      ...(tables && tables.length > 0 ? { tables } : {}),
    });

    return response.data;
  },

  downloadBackup: async (key: string) => {
    const response = await apiClient.post('/backup/download', { key }, { responseType: 'blob' });
    const blob = new Blob([response.data as BlobPart], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = key.split('/').pop() ?? 'backup.json';
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restoreBackup: async (key: string) => {
    const response = await apiClient.post('/backup/restore', { key });
    return response.data;
  },

  cleanupBackups: async () => {
    const response = await apiClient.post('/backup/cleanup');
    return response.data;
  },
  syncToS3: async (key: string) => {
    const response = await apiClient.post('/backup/sync-s3', { key });
    return response.data;
  },

  syncAllToS3: async () => {
    const response = await apiClient.post('/backup/sync-s3/all');
    return response.data;
  },

  getRetentionPolicies: async () => {
    return (await apiClient.get('/backup/retention')).data as RetentionPolicy[];
  },

  updateRetentionPolicy: async (trigger: string, days: number | null) => {
    return (await apiClient.patch('/backup/retention', { trigger, days })).data;
  },
};

export type RetentionPolicy = {
  trigger: string;
  days: number | null;
  updatedAt: string;
};

export const JobAPI = {
  getJobs: async () => (await apiClient.get('/jobs')).data,
  createJob: async (data: any) => (await apiClient.post('/jobs', data)).data,
  updateJob: async (id: string, data: any) => (await apiClient.put(`/jobs/${id}`, data)).data,
  toggleJob: async (id: string, isActive: boolean) => (await apiClient.put(`/jobs/${id}/toggle`, { isActive })).data,
  triggerJob: async (id: string) => (await apiClient.post(`/jobs/${id}/trigger`)).data,
};

export const ReaderAPI = {
  getAllowedTables: async () => {
    try {
      const response= await apiClient.get('/tables/allowed');
      return response.data; // Trả về mảng [{ id, name, description }]
    } catch (error) {
      console.error("Lỗi lấy danh sách bảng:", error);
      return [];
    }
  },

  getTableData: async (tableId: string, page: number, search: string) => {
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search ? { search } : {})
      });

      const res = await apiClient.get(`/api/master-data/${tableId}?${query}`);
      const response = res.data;

      // Response trả về từ service findAll của bạn có dạng: { data: [...], meta: { totalPages: ... } }
      const rawData = response.data || [];
      const meta = response.meta || { totalPages: 1 };

      const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

      return {
        columns,
        data: rawData,
        metadata: {
          totalPages: meta.totalPages
        }
      };
    } catch (error) {
      console.error(`Lỗi tải dữ liệu bảng ${tableId}:`, error);
      return { columns: [], data: [], metadata: { totalPages: 1 } };
    }
  },

  exportAllTableData: async (tableId: string, search: string) => {
    const PAGE_SIZE = 5000;
    const allData: Record<string, unknown>[] = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      const query = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_SIZE.toString(),
        ...(search ? { search } : {}),
      });
      const res = await apiClient.get(`/api/master-data/${tableId}?${query}`);
      const body = res.data;
      const pageData: Record<string, unknown>[] = body?.data || [];

      allData.push(...pageData);

      if (currentPage === 1) {
        totalPages = body?.meta?.totalPages ?? 1;
      }
      currentPage++;
    } while (currentPage <= totalPages);

    const columns = allData.length > 0 ? Object.keys(allData[0]) : [];
    return { columns, data: allData };
  },
};

export const AdminDataAPI = {
  getTableData: async (tableId: string, page: number, search: string) => {
    const query = new URLSearchParams({ page: String(page), limit: '20', ...(search ? { search } : {}) });
    const res = await apiClient.get(`/api/master-data/${tableId}?${query}`);
    const body = res.data;
    const rawData: Record<string, unknown>[] = body?.data || [];
    return {
      columns: rawData.length > 0 ? Object.keys(rawData[0]) : [],
      data: rawData,
      metadata: { total: body?.meta?.total ?? 0, totalPages: body?.meta?.totalPages ?? 1 },
    };
  },

  exportAllTableData: async (tableId: string, search: string) => {
    const PAGE_SIZE = 5000;
    const allData: Record<string, unknown>[] = [];
    let currentPage = 1;
    let totalPages = 1;
    do {
      const query = new URLSearchParams({ page: String(currentPage), limit: String(PAGE_SIZE), ...(search ? { search } : {}) });
      const res = await apiClient.get(`/api/master-data/${tableId}?${query}`);
      const body = res.data;
      allData.push(...(body?.data || []));
      if (currentPage === 1) totalPages = body?.meta?.totalPages ?? 1;
      currentPage++;
    } while (currentPage <= totalPages);
    return { columns: allData.length > 0 ? Object.keys(allData[0]) : [], data: allData };
  },

  executeRawQuery: async (sql: string): Promise<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    executionTime: number;
  }> => {
    const response = await apiClient.post('/api/master-data/raw-query', { sql });
    return response.data;
  },
};

export type RoleType = 'admin' | 'reader' | 'writer' | 'user';

export type RoleSummary = {
  id: number;
  roleName: string;
  type: RoleType;
  tablePatterns: string[];
  description?: string;
};

export type RoleSettings = {
  writeScopes: string[];
  readScopes: string[];
};

export type UserPermissionSummary = {
  userId: number;
  username: string;
  email: string;
  role: RoleType;
  roleSettings: RoleSettings | null;
  vpnIp: string | null;
};

export const AccessControlAPI = {
  getUsersPermissionSummary: async (): Promise<UserPermissionSummary[]> => {
    return (await apiClient.get('/users/permissions')).data;
  },

  getRoles: async (): Promise<RoleSummary[]> => {
    return (await apiClient.get('/roles')).data;
  },

  assignRole: async (userId: number, role: RoleType) => {
    return (await apiClient.put(`/users/${userId}/role`, { role })).data;
  },

  updateRoleSettings: async (userId: number, roleSettings: RoleSettings) => {
    return (await apiClient.post(`/users/${userId}/permissions`, roleSettings)).data;
  },

  createUser: async (data: { username: string; email: string; password: string; fullName?: string }) => {
    return (await apiClient.post('/users', data)).data;
  },

  deleteUser: async (userId: number) => {
    return (await apiClient.delete(`/users/${userId}`)).data;
  },

  setVpnIp: async (userId: number, vpnIp: string | null) => {
    return (await apiClient.patch(`/users/${userId}`, { vpnIp })).data;
  },
};

export const SourceConfigAPI = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/source-configs');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch source configs:', error);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await apiClient.get(`/source-configs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch source config:', error);
      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await apiClient.put(`/source-configs/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update source config:', error);
      throw error;
    }
  },
};