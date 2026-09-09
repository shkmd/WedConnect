import { createHash } from 'node:crypto';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConsentAction } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../platform/prisma.service';

const grantSchema = z.object({ purpose: z.string().min(3).max(120), noticeVersion: z.string().min(1).max(40), noticeText: z.string().min(20).max(5000), recipientId: z.string().uuid().optional(), sharedFields: z.array(z.string().min(1).max(80)).max(20).default([]), source: z.enum(['web', 'mobile']) });

@Injectable()
export class ConsentService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  grant(userId: string, input: unknown) {
    const parsed = grantSchema.safeParse(input); if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    return this.prisma.consentRecord.create({ data: { userId, purpose: parsed.data.purpose, action: ConsentAction.GRANTED, noticeVersion: parsed.data.noticeVersion, noticeText: parsed.data.noticeText, noticeTextHash: this.hash(parsed.data.noticeText), recipientId: parsed.data.recipientId ?? null, sharedFields: parsed.data.sharedFields, source: parsed.data.source } });
  }
  async withdraw(userId: string, consentId: string, source: string) {
    const original = await this.prisma.consentRecord.findFirst({ where: { id: consentId, userId, action: ConsentAction.GRANTED } });
    if (!original) throw new NotFoundException('Consent record not found');
    return this.prisma.consentRecord.create({ data: { userId, purpose: original.purpose, action: ConsentAction.WITHDRAWN, noticeVersion: original.noticeVersion, noticeText: original.noticeText, noticeTextHash: original.noticeTextHash, recipientId: original.recipientId, sharedFields: original.sharedFields, source, supersedesId: original.id } });
  }
  history(userId: string) { return this.prisma.consentRecord.findMany({ where: { userId }, orderBy: { occurredAt: 'desc' } }); }
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
}
