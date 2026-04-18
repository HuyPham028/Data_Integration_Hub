import { PermissionType } from '../dto/create-permission.dto';

export class Permission {
  id: number;
  name: string;
  type: PermissionType;
  tablePatterns: string[];
  description?: string;
}
