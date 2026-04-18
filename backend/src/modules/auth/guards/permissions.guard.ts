import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { RoleSettings } from '../../users/users.service';

/**
 * PermissionsGuard — kiểm tra quyền truy cập bảng dựa trên roleSettings trong JWT.
 *
 * JWT payload có dạng:
 *   role: 'admin' | 'reader' | 'writer'
 *   roleSettings: {
 *     writeScopes: ["^tcns_.*"],   // regex — writer có thể đọc + ghi
 *     readScopes:  ["^dm_.*"]      // regex — đọc thêm (cả reader lẫn writer)
 *   }
 *
 * Logic:
 *   admin                         → bypass toàn bộ
 *   GET (read)    - reader/writer → khớp readScopes HOẶC writeScopes
 *   POST/PUT/PATCH/DELETE (write) → chỉ writer, khớp writeScopes
 *
 * Route không có :table param → bỏ qua.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  private matchesAny(patterns: string[], table: string): boolean {
    return patterns.some((pattern) => {
      try {
        return new RegExp(pattern).test(table);
      } catch {
        return false;
      }
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const table: string | undefined = request.params?.table;

    if (!table) return true;

    const user = request.user;
    const role: string = user?.role;
    const roleSettings = user?.roleSettings as RoleSettings | null;
    const isWrite = this.WRITE_METHODS.has(request.method as string);

    // Admin bypass hoàn toàn
    if (role === 'admin') return true;

    if (!roleSettings) {
      throw new ForbiddenException('Tài khoản chưa được cấu hình quyền truy cập.');
    }

    const writeScopes = roleSettings.writeScopes ?? [];
    const readScopes = roleSettings.readScopes ?? [];

    if (isWrite) {
      // Chỉ writer được ghi, phải khớp writeScopes
      if (role !== 'writer') {
        throw new ForbiddenException(`Role "${role}" không có quyền ghi dữ liệu.`);
      }
      if (!this.matchesAny(writeScopes, table)) {
        throw new ForbiddenException(`Không có quyền ghi bảng: ${table}`);
      }
    } else {
      // Đọc: reader khớp readScopes, writer khớp readScopes HOẶC writeScopes
      const readable = role === 'writer'
        ? [...readScopes, ...writeScopes]
        : readScopes;

      if (!this.matchesAny(readable, table)) {
        throw new ForbiddenException(`Không có quyền đọc bảng: ${table}`);
      }
    }

    return true;
  }
}
