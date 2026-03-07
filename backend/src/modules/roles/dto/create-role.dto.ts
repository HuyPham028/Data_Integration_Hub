import { IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  roleName: string;

  @IsString()
  description: string;
}
