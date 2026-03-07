import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  permissionKey: string;

  @IsString()
  description?: string;
}
