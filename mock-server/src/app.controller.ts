import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { DATA_VERSION_1, DATA_VERSION_2 } from './mock-data';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('sinh-vien')
  getSinhVien(@Query('version') version: string) {
    if (version === '2') {
      return {
        statusCode: 200,
        message: "Lấy dữ liệu thành công (Ngày 2)",
        data: DATA_VERSION_2
      };
    }

    return {
      statusCode: 200,
      message: "Lấy dữ liệu thành công (Ngày 1)",
      data: DATA_VERSION_1
    };
  }

  @Get('dm-dan-toc')
  getDantoc() {
    return [
      { ma: "01", ten: "Kinh", active: true},
      { ma: "02", ten: "Tày", active: true},
      { ma: "03", ten: "Thái", active: true},
    ]
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
