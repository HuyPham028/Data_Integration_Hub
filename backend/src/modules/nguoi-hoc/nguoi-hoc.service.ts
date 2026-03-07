import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Đảm bảo đường dẫn đúng

@Injectable()
export class NguoiHocService {
  private readonly logger = new Logger(NguoiHocService.name);

  constructor(private prisma: PrismaService) {}

  // Hàm này nhận cục data từ Mock Server và xử lý
  async syncBatch(data: any[]) {
    const results = {
      total: data.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: any; msg: string }>,
    };

    for (const item of data) {
      try {
        await this.syncOneStudent(item);
        results.success++;
      } catch (error) {
        this.logger.error(`Lỗi đồng bộ SV ${item.cccdSo}: ${error.message}`);
        results.failed++;
        results.errors.push({ id: item.cccdSo, msg: error.message });
      }
    }

    return results;
  }

  // Logic xử lý cho 1 sinh viên (Dùng Transaction)
  private async syncOneStudent(rawData: any) {
    // 1. Tách dữ liệu quan hệ (bảng con) ra khỏi dữ liệu cha
    // Lưu ý: Tên field 'nhDaoTaos' phải khớp với JSON từ Mock Server trả về
    const { nhDaoTaos, ...studentInfoRaw } = rawData;

    // 2. Làm sạch dữ liệu Cha (Chuyển string ngày tháng thành Date)
    const studentInfo = this.convertDates(studentInfoRaw);

    // 3. Bắt đầu Transaction
    await this.prisma.$transaction(async (tx) => {
      
      // A. UPSERT NGƯỜI HỌC (CHA)
      // Dùng cccdSo làm khóa định danh duy nhất
      if (!studentInfo.cccdSo) {
        throw new Error('Dữ liệu thiếu cccdSo, không thể định danh.');
      }

      const student = await tx.nguoiHoc.upsert({
        where: { cccdSo: studentInfo.cccdSo },
        update: studentInfo,
        create: studentInfo,
      });

      // B. XỬ LÝ QUÁ TRÌNH ĐÀO TẠO (CON) - CHIẾN LƯỢC SNAPSHOT
      // Giải quyết vấn đề: "Dữ liệu con không có ID, làm sao update?" -> Xóa hết thêm lại.
      
      // B1. Xóa toàn bộ quá trình đào tạo cũ của SV này
      await tx.nhDaoTao.deleteMany({
        where: { nguoiHocId: student.id },
      });

      // B2. Thêm mới toàn bộ danh sách từ API
      if (nhDaoTaos && Array.isArray(nhDaoTaos) && nhDaoTaos.length > 0) {
        const daoTaoData = nhDaoTaos.map((dt) => ({
          ...this.convertDates(dt), // Convert ngày tháng cho bảng con
          nguoiHocId: student.id,   // Gán ID cha
        }));

        await tx.nhDaoTao.createMany({
          data: daoTaoData,
        });
      }
    });
  }

  // --- HÀM TIỆN ÍCH: Convert String -> Date ---
  // Prisma sẽ lỗi nếu bạn ném string vào trường DateTime
  private convertDates(obj: any) {
    const newObj = { ...obj };
    // Danh sách các cột là DateTime trong schema của bạn
    const dateFields = [
      'cccdNgayCap', 'ngaySinh', 'doanNgayVao', 'dangNgayVao', 
      'createdAt', 'updatedAt', 
      'ngayNhapHoc', 'trungTuyenNgayQd', 'vbNgayCap', 'tnNgayQd', 'ngayQd', 'ngayChuyenTrangThai'
    ];

    for (const key of Object.keys(newObj)) {
      // Nếu key nằm trong danh sách dateFields VÀ giá trị là chuỗi
      if (dateFields.includes(key) && typeof newObj[key] === 'string') {
        const dateVal = new Date(newObj[key]);
        // Kiểm tra nếu date hợp lệ thì gán, không thì để null
        if (!isNaN(dateVal.getTime())) {
          newObj[key] = dateVal;
        } else {
          newObj[key] = null;
        }
      }
    }
    return newObj;
  }
}