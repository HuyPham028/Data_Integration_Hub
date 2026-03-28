const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001; // Chạy trên Port 4000 để không đụng với NestJS (3000) và NextJS (3001)

app.use(cors());
app.use(express.json());

// --- KHO DỮ LIỆU GIẢ LẬP ---
const mockDatabase = {
  'tcns_can_bo': [
    { 
      id: 111, 
      shcc: "SH111", 
      ho: "Nguyễn Văn", 
      ten: "An", 
      ngaySinh: "1985-05-15",
      gioiTinh: "M", 
      maNhanVien: "CB001", 
      email: "nvan@hcmut.edu.vn", 
      sdt: "0901234567",
      createdAt: new Date(),
      updatedAt: new Date()
    },
  ]
};

// --- API ENDPOINT ---
// Định tuyến động hứng mọi request dạng: /api/source/:tableName
app.get('/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  
  // Lấy query parameters (mặc định page 1, limit 2 để test phân trang)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;

  // 1. Kiểm tra xem bảng có tồn tại trong hệ thống nguồn không
  const tableData = mockDatabase[tableName];
  if (!tableData) {
    return res.status(404).json({
      success: false,
      message: `Bảng ${tableName} không tồn tại trên hệ thống nguồn.`
    });
  }

  // 2. Tính toán phân trang (Pagination)
  const totalRecords = tableData.length;
  const totalPages = Math.ceil(totalRecords / limit);
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const payload = tableData.slice(startIndex, endIndex);

  // 3. Giả lập độ trễ mạng (Network Latency: 300ms) để giống thực tế
  setTimeout(() => {
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metadata: {
        tableName: tableName,
        totalRecords: totalRecords,
        totalPages: totalPages,
        currentPage: page,
        limit: limit
      },
      payload: payload
    });
    
    console.log(`[GET] /api/source/${tableName}?page=${page}&limit=${limit} -> Trả về ${payload.length} records.`);
  }, 300);
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`Mock Source Server`);
  console.log(`Chạy tại: http://localhost:${PORT}`);
  console.log(`=========================================`);
});