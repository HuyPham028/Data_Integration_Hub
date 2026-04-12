// Module Roles đã được xóa — role được quản lý trực tiếp trên User.
// Xem: PUT /users/:id/role và POST /users/:id/permissions
import { Controller } from '@nestjs/common';
@Controller()
export class RolesController {}
