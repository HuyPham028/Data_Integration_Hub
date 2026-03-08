import { Test, TestingModule } from '@nestjs/testing';
import { NguoiHocController } from './nguoi-hoc.controller';

describe('NguoiHocController', () => {
  let controller: NguoiHocController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NguoiHocController],
    }).compile();

    controller = module.get<NguoiHocController>(NguoiHocController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
