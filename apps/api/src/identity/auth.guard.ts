import type { CanActivate, ExecutionContext} from '@nestjs/common';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth-context';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const cookie = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('wc_access_token='))?.slice(16);
    const token = bearer ?? cookie;
    if (!token) throw new UnauthorizedException('Authentication required');
    request.auth = { userId: await this.auth.verifyAccessToken(token), accessToken: token };
    return true;
  }
}
