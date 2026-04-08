import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Đảm bảo đường dẫn đúng
import { EventLogService } from 'src/common/event-log/event-log.service';

@Injectable()
export class NguoiHocService {
  private readonly logger = new Logger(NguoiHocService.name);

  constructor(
    private prisma: PrismaService,
    private logService: EventLogService
  ) {}

  async syncBatch(data: any[]) {
    const jobLog = await this.logService.createJobLog(
      'Synchronize người học',
      'NguoiHoc_Mock',
      'scheduled_sync'
    )

    const metrics = { nguoi_hoc: { total: data.length, success: 0, failed: 0 } };
    const errorsList = [] as Array<{ id: any; msg: string }>; 

    for (const item of data) {
      try {
        await this.syncOneStudent(item);
        metrics.nguoi_hoc.success++;
      } catch (error) {
        this.logger.error(`Lỗi đồng bộ SV ${item.cccdSo}: ${error.message}`);
        metrics.nguoi_hoc.failed++;
        errorsList.push({ id: item.cccdSo, msg: error.message });
      }
    }

    // update log status when the job is done
    const finalStatus = metrics.nguoi_hoc.failed === 0 ? 'done' : 
                       (metrics.nguoi_hoc.success === 0 ? 'failed' : 'partial_success');
                       
    await this.logService.finishJobLog(
      jobLog._id.toString(), 
      finalStatus, 
      metrics, 
      errorsList
    );

    return {
      total: metrics.nguoi_hoc.total,
      success: metrics.nguoi_hoc.success,
      failed: metrics.nguoi_hoc.failed
    };
  }

  private async syncOneStudent(rawData: any) {
    const { nhDaoTaos, ...studentInfoRaw } = rawData;

    const studentInfo = this.convertDates(studentInfoRaw);

    await this.prisma.$transaction(async (tx) => {
      
      // A. UPSERT NGƯỜI HỌC (CHA)
      // Dùng id làm khóa định danh duy nhất
      if (!studentInfo.id) {
        throw new Error('Dữ liệu thiếu id, không thể định danh.');
      }

      const { id, ...updateFields } = studentInfo;
      const student = await tx.nguoiHoc.upsert({
        where: { id },
        update: updateFields,
        create: studentInfo,
      });

      // B.SNAPSHOT
      
      await tx.nhDaoTao.deleteMany({
        where: { nguoiHocId: student.id },
      });

      if (nhDaoTaos && Array.isArray(nhDaoTaos) && nhDaoTaos.length > 0) {
        const daoTaoData = nhDaoTaos.map((dt) => ({
          ...this.convertDates(dt),
          nguoiHocId: student.id,
          cccdSo: student.cccdSo,
          maNguoiHoc: studentInfo.maNguoiHoc
        }));

        await tx.nhDaoTao.createMany({
          data: daoTaoData,
        });
      }
    });
  }

  private convertDates(obj: any) {
    const newObj = { ...obj };
    const dateFields = [
      'cccdNgayCap', 'ngaySinh', 'doanNgayVao', 'dangNgayVao', 
      'createdAt', 'updatedAt', 
      'ngayNhapHoc', 'trungTuyenNgayQd', 'vbNgayCap', 'tnNgayQd', 'ngayQd', 'ngayChuyenTrangThai'
    ];

    for (const key of Object.keys(newObj)) {
      if (dateFields.includes(key) && typeof newObj[key] === 'string') {
        const dateVal = new Date(newObj[key]);
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