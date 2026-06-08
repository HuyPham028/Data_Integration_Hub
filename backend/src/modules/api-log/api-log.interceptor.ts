import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => void this.saveLog(req, context, Date.now() - start, 200),
        error: (err) => void this.saveLog(req, context, Date.now() - start, err?.status ?? 500),
      }),
    );
  }

  private async saveLog(req: any, ctx: ExecutionContext, ms: number, status: number) {
    try {
      const tableName: string = req.params?.table ?? req.params?.id ?? 'unknown';
      const user = req.user;
      const ip =
        (req.headers['x-real-ip'] as string) ||
        (req.headers['x-forwarded-for'] as string) ||
        req.socket?.remoteAddress ||
        null;

      await this.prisma.apiAccessLog.create({
        data: {
          userId: user?.sub ?? null,
          username: user?.username ?? null,
          tableName,
          method: req.method,
          statusCode: status,
          responseTimeMs: ms,
          ipAddress: ip,
        },
      });
    } catch {
      // fire-and-forget — không throw để không ảnh hưởng response
    }
  }
}
