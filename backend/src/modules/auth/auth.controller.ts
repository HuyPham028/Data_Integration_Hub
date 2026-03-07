import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
