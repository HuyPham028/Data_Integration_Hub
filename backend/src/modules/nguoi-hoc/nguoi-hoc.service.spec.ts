import { Test, TestingModule } from '@nestjs/testing';
import { NguoiHocService } from './nguoi-hoc.service';

describe('NguoiHocService', () => {
  let service: NguoiHocService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NguoiHocService],
    }).compile();

    service = module.get<NguoiHocService>(NguoiHocService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
