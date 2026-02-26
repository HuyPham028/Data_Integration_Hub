import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  permission_key: string;

  @IsString()
  description: string;
}
