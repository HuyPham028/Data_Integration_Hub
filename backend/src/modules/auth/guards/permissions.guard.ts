import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * PermissionsGuard — kiểm tra quyền truy cập theo bảng (table param).
 *
 * JWT payload chứa mảng permissions dạng: "{type}:{tablePattern}"
 *   - "reader:^dm_.*"          → đọc tất cả bảng dm_*
 *   - "writer:^tcns_.*"        → đọc + ghi bảng tcns_*
 *   - "writer:nguoi_hoc|nh_.*" → đọc + ghi bảng nguoi_hoc và nh_*
 *
 * Logic:
 *   - GET                         → yêu cầu reader HOẶC writer khớp pattern
 *   - POST / PUT / PATCH / DELETE → yêu cầu writer khớp pattern
 *
 * Route không có :table param → bỏ qua (trả về true).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const table: string | undefined = request.params?.table;

    // Route không dùng :table → không cần kiểm tra
    if (!table) return true;

    const user = request.user;
    const userPermissions: string[] = user?.permissions ?? [];

    // Admin bypass hoàn toàn
    if (userPermissions.includes('admin')) return true;
    const isWrite = this.WRITE_METHODS.has(request.method as string);

    const hasAccess = userPermissions.some((perm) => {
      const colonIdx = perm.indexOf(':');
      if (colonIdx === -1) return false;

      const type = perm.substring(0, colonIdx);     // "reader" | "writer"
      const pattern = perm.substring(colonIdx + 1); // regex string

      // reader không được phép thực hiện thao tác ghi
      if (isWrite && type !== 'writer') return false;

      try {
        return new RegExp(pattern).test(table);
      } catch {
        return false;
      }
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        `Không có quyền ${isWrite ? 'ghi' : 'đọc'} bảng: ${table}`,
      );
    }

    return true;
  }
}
