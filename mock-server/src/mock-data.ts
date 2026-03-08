export const DATA_VERSION_1 = [
  {
    // === THÔNG TIN CÁ NHÂN (Khớp model NguoiHoc) ===
    cccdSo: "079099123456", // Đây là KEY để định danh (thay vì ID)
    cccdNgayCap: "2020-01-01T00:00:00.000Z",
    cccdNoiCap: "Cục Cảnh sát QLHC về TTXH",
    ho: "Nguyễn",
    ten: "Văn An",
    ngaySinh: "2002-05-15T00:00:00.000Z",
    noiSinhPhuongXa: "Phường 1, Quận 1, TP.HCM",
    emailCaNhan: "an.nguyen@gmail.com",
    soDienThoai: "0909123456",
    gioiTinh: "Nam",
    quocTich: "Việt Nam",
    tonGiao: "Không",
    danToc: "Kinh",

    // === THÔNG TIN GIA ĐÌNH (Dạng cột phẳng) ===
    chaHoTen: "Nguyễn Văn Ba",
    chaNamSinh: 1975,
    chaNgheNghiep: "Kỹ sư",
    chaDienThoai: "0909888777",
    meHoTen: "Lê Thị Bốn",
    meNamSinh: 1978,
    
    // === QUAN HỆ 1-N: QUÁ TRÌNH ĐÀO TẠO (Khớp model NhDaoTao) ===
    // Đây là phần demo bài toán "List không có ID"
    nhDaoTaos: [
      {
        maTuyenSinh: "TS2020_001",
        trinhDoDaoTao: "Đại học",
        khoa: "Khoa học Máy tính",
        ngayNhapHoc: "2020-09-05T00:00:00.000Z",
        trangThaiNguoiHoc: "Đang học"
      },
      {
        maTuyenSinh: "TS2020_CLC", 
        trinhDoDaoTao: "Chứng chỉ ngắn hạn",
        khoa: "Trung tâm Ngoại ngữ",
        ngayNhapHoc: "2021-06-01T00:00:00.000Z",
        trangThaiNguoiHoc: "Đã hoàn thành"
      }
    ]
  }
];

// Dữ liệu Ngày 2: Sinh viên thay đổi SĐT và Danh sách đào tạo thay đổi
export const DATA_VERSION_2 = [
  {
    // Vẫn là CCCD cũ để hệ thống biết là cùng 1 người -> Update
    cccdSo: "079099123456", 
    
    // Thay đổi thông tin cá nhân
    ho: "Nguyễn",
    ten: "Văn An",
    emailCaNhan: "an.nguyen.new@gmail.com", // <--- Đổi Email
    soDienThoai: "0999999999",             // <--- Đổi SĐT
    
    // Giữ nguyên các trường khác (trong thực tế API sẽ trả về đủ)
    ngaySinh: "2002-05-15T00:00:00.000Z",
    gioiTinh: "Nam",
    // ...

    // === QUAN HỆ 1-N THAY ĐỔI ===
    // Tình huống: Hủy bỏ chứng chỉ ngắn hạn, chỉ còn Đại học
    nhDaoTaos: [
      {
        maTuyenSinh: "TS2020_001", // Giữ nguyên cái Đại học
        trinhDoDaoTao: "Đại học",
        khoa: "Khoa học Máy tính",
        ngayNhapHoc: "2020-09-05T00:00:00.000Z",
        trangThaiNguoiHoc: "Đang học"
      }
      // Đã XÓA cái "Chứng chỉ ngắn hạn"
    ]
  }
];