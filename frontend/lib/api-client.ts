import axios from 'axios';

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

export const ReaderAPI = {
  getAllowedTables: async () => {
    return new Promise<any[]>((resolve) => setTimeout(() => resolve([
      { id: 'nh_dao_tao', name: 'Sinh viên (Đào tạo)', description: 'Danh sách sinh viên toàn trường', totalRecords: 68743 },
      { id: 'tcns_can_bo', name: 'Cán bộ / Giảng viên', description: 'Hồ sơ nhân sự, phòng ban', totalRecords: 1106 },
      { id: 'dm_gioi_tinh', name: 'Danh mục: Giới tính', description: 'Bảng tham chiếu giới tính', totalRecords: 3 },
    ]), 500));
  },

  getTableData: async (tableName: string, page: number = 1, search: string = '') => {
    return new Promise<any>((resolve) => {
      setTimeout(() => {
        // Dữ liệu Mock dựa vào bảng được chọn
        let data = [];
        let columns = [];

        if (tableName === 'nh_dao_tao') {
          columns = ['id', 'maNguoiHoc', 'cccdSo', 'trinhDoDaoTao', 'emailTruong'];
          data = [
            { id: 1, maNguoiHoc: 'SV001', cccdSo: '079200001234', trinhDoDaoTao: 'Đại học', emailTruong: 'sv001@hcmut.edu.vn' },
            { id: 2, maNguoiHoc: 'SV002', cccdSo: '079200001235', trinhDoDaoTao: 'Đại học', emailTruong: 'sv002@hcmut.edu.vn' },
            { id: 3, maNguoiHoc: 'SV003', cccdSo: '079200001236', trinhDoDaoTao: 'Thạc sĩ', emailTruong: 'sv003@hcmut.edu.vn' },
          ];
        } else if (tableName === 'tcns_can_bo') {
          columns = ['maNhanVien', 'ho', 'ten', 'gioiTinh', 'email'];
          data = [
            { maNhanVien: 'CB001', ho: 'Nguyễn Văn', ten: 'A', gioiTinh: 'Nam', email: 'nva@hcmut.edu.vn' },
            { maNhanVien: 'CB002', ho: 'Trần Thị', ten: 'B', gioiTinh: 'Nữ', email: 'ttb@hcmut.edu.vn' },
          ];
        } else {
          columns = ['ma', 'ten', 'active'];
          data = [{ ma: 'M', ten: 'Nam', active: true }, { ma: 'F', ten: 'Nữ', active: true }];
        }

        // Giả lập logic search (Lọc trên Frontend để demo)
        if (search) {
          data = data.filter(item => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
        }

        resolve({
          columns, // Quan trọng: API nên trả về danh sách cột để UI render động
          data,
          metadata: { totalPages: 14, currentPage: page, totalRecords: 68743 }
        });
      }, 600);
    });
  }
};