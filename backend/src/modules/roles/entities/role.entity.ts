export class Role {
  id: string;
  role_name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  permissions?: any[];
}
