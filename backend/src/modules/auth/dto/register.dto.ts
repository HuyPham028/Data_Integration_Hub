import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsString()
  @ApiProperty({ example: 'john_doe' })
  username: string;

  @IsEmail()
  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'StrongPassword123!' })
  password: string;
}
