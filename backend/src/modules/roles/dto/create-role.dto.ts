import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum RoleType {
  admin = 'admin',
  reader = 'reader',
  writer = 'writer',
  user = 'user',
}

/**
 * Ví dụ:
 * {
 *   "roleName": "hr_reader",
 *   "type": "reader",
 *   "tablePatterns": ["^dm_.*", "^tcns_.*"],
 *   "description": "Đọc dữ liệu HR"
 * }
 *
 * Admin role:
 * {
 *   "roleName": "admin",
 *   "type": "admin",
 *   "tablePatterns": [],
 *   "description": "Toàn quyền"
 * }
 */
export class CreateRoleDto {
  @IsString()
  roleName: string;

  @IsEnum(RoleType, { message: 'type phải là "admin", "reader" hoặc "writer"' })
  type: RoleType;

  @IsArray()
  @IsString({ each: true })
  tablePatterns: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
