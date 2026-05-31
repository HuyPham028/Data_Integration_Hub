import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn(), on: jest.fn(), off: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
