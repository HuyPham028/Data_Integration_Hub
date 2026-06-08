import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: ExpressRequest) {
    // Lấy IP thực từ X-Real-IP (Kong forward) hoặc X-Forwarded-For
    const clientIp =
      (req.headers['x-real-ip'] as string) ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';
    return this.authService.login(dto, clientIp);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    console.log(dto);
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req) {
    return req.user;
  }

  @Post('refresh-token')
  refreshToken(@Body('refreshToken') token: string) {
    return this.authService.refreshToken(token);
  }
}
