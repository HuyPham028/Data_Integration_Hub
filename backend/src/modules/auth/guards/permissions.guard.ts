import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class PermissionsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const required =
      context.getHandler() &&
      Reflect.getMetadata('permissions', context.getHandler());
    if (!required || required.length === 0) {
      return true;
    }
    return required.every((perm) => user?.permissions?.includes(perm));
  }
}
