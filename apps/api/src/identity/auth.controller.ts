import { Body, Controller, Get, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth-context';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Post('otp/request') request(@Body() body: unknown) { return this.auth.requestOtp(body); }
  @Post('otp/verify') async verify(@Body() body: unknown, @Res({ passthrough: true }) response: { cookie(name: string, value: string, options: Record<string, unknown>): void }) {
    const result = await this.auth.verifyOtp(body);
    if (result.clientKind === 'web') {
      const secure = process.env.NODE_ENV === 'production';
      response.cookie('wc_access_token', result.accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: result.expiresIn * 1000, path: '/' });
      response.cookie('wc_refresh_token', result.refreshToken, { httpOnly: true, secure, sameSite: 'strict', path: '/api/v1/auth' });
      return { userId: result.userId, expiresIn: result.expiresIn };
    }
    return result;
  }
  @Post('refresh') async refresh(@Req() request: AuthenticatedRequest, @Body() body: { refreshToken?: string; clientKind?: string }, @Res({ passthrough: true }) response: { cookie(name: string, value: string, options: Record<string, unknown>): void }) {
    const cookieToken = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('wc_refresh_token='))?.slice(17);
    const result = await this.auth.refresh(body.refreshToken ?? cookieToken ?? '');
    if (body.clientKind !== 'mobile') {
      const secure = process.env.NODE_ENV === 'production';
      response.cookie('wc_access_token', result.accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: result.expiresIn * 1000, path: '/' });
      response.cookie('wc_refresh_token', result.refreshToken, { httpOnly: true, secure, sameSite: 'strict', path: '/api/v1/auth' });
      return { userId: result.userId, expiresIn: result.expiresIn };
    }
    return result;
  }
  @Post('logout') @UseGuards(AuthGuard) async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: { clearCookie(name: string, options: Record<string, unknown>): void }) {
    const result = await this.auth.revoke(request.auth.accessToken);
    response.clearCookie('wc_access_token', { path: '/' }); response.clearCookie('wc_refresh_token', { path: '/api/v1/auth' });
    return result;
  }
  @Get('me') @UseGuards(AuthGuard) @ApiBearerAuth()
  me(@Req() request: AuthenticatedRequest) { return this.auth.context(request.auth.userId); }
}
