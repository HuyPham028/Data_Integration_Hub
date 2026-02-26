import { IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  role_name: string;

  @IsString()
  description: string;
}
