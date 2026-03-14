import { Controller, Get, Query } from '@nestjs/common';
import { NguoiHocService } from './nguoi-hoc.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Controller('nguoi-hoc')
export class NguoiHocController {
  constructor(
    private readonly nguoiHocService: NguoiHocService,
    private readonly httpService: HttpService 
  ) {}

  // Call GET http://localhost:3000/nguoi-hoc/trigger-sync?version=1
  @Get('trigger-sync')
  async triggerSync(@Query('version') version: string = '1') {
    // 1. Call the server 
    const mockUrl = `http://localhost:3001/api/nguoi-hoc?version=${version}`;
    console.log(`Đang gọi Mock Server: ${mockUrl}`);
    
    try {
      const response = await firstValueFrom(this.httpService.get(mockUrl));
      const dataFromMock = response.data.data; // { statusCode, data: [...] }
      
      console.log(`Nhận được ${dataFromMock.length} bản ghi từ Mock.`);

      const result = await this.nguoiHocService.syncBatch(dataFromMock);
      
      return {
        message: 'Đồng bộ hoàn tất',
        mockVersion: version,
        result: result
      };
    } catch (error) {
      return {
        message: 'Lỗi khi gọi Mock Server',
        error: error.message
      };
    }
  }
}