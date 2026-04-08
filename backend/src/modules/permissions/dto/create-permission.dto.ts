import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';

export enum PermissionType {
  reader = 'reader',
  writer = 'writer',
}

/**
 * Tạo permission mới với định dạng YAML-like:
 *
 * {
 *   "name": "HR Data Reader",
 *   "type": "reader",
 *   "tablePatterns": [
 *     "^dm_.*",
 *     "^tcns_can_bo$"
 *   ],
 *   "description": "Đọc dữ liệu HR"
 * }
 *
 * tablePatterns: mảng regex khớp với tên bảng (table param trên route).
 * type "writer" bao gồm cả quyền đọc.
 */
export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsEnum(PermissionType, { message: 'type phải là "reader" hoặc "writer"' })
  type: PermissionType;

  @IsArray()
  @IsString({ each: true })
  tablePatterns: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
