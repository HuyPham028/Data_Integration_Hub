import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username);

    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.username, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.userRoles.map((ur) => ur.role.roleName);

    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.permissionKey),
    );

    const payload = {
      sub: user.id,
      username: user.username,
      roles,
      permissions,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async register(dto: RegisterDto) {
    // const hashed = await bcrypt.hash(dto.password, 10);

    return this.usersService.createUser({
      username: dto.username,
      email: dto.email,
      password: dto.password,
    });
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return { accessToken: this.jwtService.sign(payload) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
