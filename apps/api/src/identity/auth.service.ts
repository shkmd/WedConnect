import { createHmac } from 'node:crypto';
import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { RoleCode} from '@prisma/client';
import { ScopeType } from '@prisma/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { PrismaService } from '../platform/prisma.service';

export const otpRequestSchema = z.object({ phone: z.string().regex(/^\+[1-9]\d{7,14}$/), roleIntent: z.enum(['CUSTOMER', 'VENDOR_OWNER']) });
export const otpVerifySchema = otpRequestSchema.extend({ token: z.string().regex(/^\d{6}$/), clientKind: z.enum(['web', 'mobile']) });

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly publishableKey: string;
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error('Supabase Auth configuration is missing');
    this.supabaseUrl = url; this.publishableKey = key;
    this.supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  }
  async requestOtp(input: unknown): Promise<{ accepted: true }> {
    const parsed = otpRequestSchema.safeParse(input); if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const subjectHash = this.hash(parsed.data.phone); const since = new Date(Date.now() - 600_000);
    if (await this.prisma.otpSecurityEvent.count({ where: { subjectHash, event: 'REQUESTED', createdAt: { gte: since } } }) >= 5) throw new HttpException('Try again later', HttpStatus.TOO_MANY_REQUESTS);
    const { error } = await this.supabase.auth.signInWithOtp({ phone: parsed.data.phone });
    await this.prisma.otpSecurityEvent.create({ data: { subjectHash, event: error ? 'REQUEST_FAILED' : 'REQUESTED' } });
    if (error) {
      const providerUnavailable = /phone|sms|provider|unsupported/i.test(error.message);
      throw new BadRequestException(providerUnavailable
        ? 'Phone sign-in is not configured yet. Enable the Phone provider and an SMS provider in Supabase.'
        : 'OTP could not be sent. Please wait a moment and try again.');
    }
    return { accepted: true };
  }
  async verifyOtp(input: unknown) {
    const parsed = otpVerifySchema.safeParse(input); if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { data, error } = await this.supabase.auth.verifyOtp({ phone: parsed.data.phone, token: parsed.data.token, type: 'sms' });
    if (error || !data.user || !data.session) throw new UnauthorizedException('Invalid or expired OTP');
    const user = data.user; const session = data.session;
    await this.prisma.$transaction(async (tx) => {
      await tx.appUser.upsert({ where: { id: user.id }, create: { id: user.id }, update: {} });
      const role = await tx.role.findUniqueOrThrow({ where: { code: parsed.data.roleIntent as RoleCode } });
      const existing = await tx.userRole.findFirst({ where: { userId: user.id, roleId: role.id, scopeType: ScopeType.PLATFORM, scopeId: null } });
      if (!existing) await tx.userRole.create({ data: { userId: user.id, roleId: role.id, scopeType: ScopeType.PLATFORM } });
      await tx.otpSecurityEvent.create({ data: { subjectHash: this.hash(parsed.data.phone), event: 'VERIFIED' } });
    });
    return { userId: user.id, clientKind: parsed.data.clientKind, accessToken: session.access_token, refreshToken: session.refresh_token, expiresIn: session.expires_in };
  }
  async verifyAccessToken(token: string): Promise<string> {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException('Invalid session');
    return data.user.id;
  }
  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token required');
    const { data, error } = await this.supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) throw new UnauthorizedException('Session cannot be refreshed');
    return { userId: data.user.id, accessToken: data.session.access_token, refreshToken: data.session.refresh_token, expiresIn: data.session.expires_in };
  }
  async revoke(accessToken: string): Promise<{ revoked: true }> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: this.publishableKey, authorization: `Bearer ${accessToken}` } });
    if (!response.ok && response.status !== 401) throw new BadRequestException('Session could not be revoked');
    return { revoked: true };
  }
  async context(userId: string) {
    return this.prisma.appUser.findUniqueOrThrow({ where: { id: userId }, include: { roles: { where: { revokedAt: null }, include: { role: { include: { permissions: { include: { permission: true } } } } } } } });
  }
  private hash(value: string): string {
    const secret = process.env.PII_HASH_SECRET; if (!secret || secret.length < 32) throw new Error('PII_HASH_SECRET must contain at least 32 characters');
    return createHmac('sha256', secret).update(value).digest('hex');
  }
}
