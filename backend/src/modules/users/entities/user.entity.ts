export class User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  roles?: any[];
  permissions?: any[];
}
