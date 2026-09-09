import type { CanActivate, ExecutionContext} from '@nestjs/common';
import { ForbiddenException, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './auth-context';
import { AuthService } from './auth.service';

const PERMISSION_KEY = 'required_permission';
export const RequiresPermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.auth.context(request.auth.userId);
    const allowed = user.roles.some((assignment) => assignment.role.permissions.some((item) => item.permission.code === required));
    if (!allowed) throw new ForbiddenException('Permission denied');
    return true;
  }
}
