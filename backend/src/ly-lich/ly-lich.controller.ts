import { Controller } from '@nestjs/common';
import { LyLichService } from './ly-lich.service';

@Controller('ly-lich')
export class LyLichController {
  constructor(private readonly lyLichService: LyLichService) {}

  // Add your controller methods here
}
