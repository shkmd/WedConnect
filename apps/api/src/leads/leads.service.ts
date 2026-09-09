import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../platform/prisma.service';
import {
  contactGrantInput,
  creditGrantInput,
  invalidReportInput,
  refundInput,
  requirementInput,
  responseInput,
  statusInput,
} from './lead.schemas';
@Injectable()
export class LeadsService {
  private readonly auth: SupabaseClient;
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {
    const u = process.env.SUPABASE_URL,
      k = process.env.SUPABASE_SECRET_KEY;
    if (!u || !k) throw new Error('Supabase server credentials required');
    this.auth = createClient(u, k, { auth: { persistSession: false } });
  }
  async createRequirement(customerId: string, body: unknown) {
    const d = requirementInput.parse(body),
      today = new Date();
    if (
      await this.db.customerRequirement.count({
        where: {
          customerId,
          cityId: d.cityId,
          categoryId: d.categoryId,
          eventDate: d.eventDate,
          status: 'ACTIVE',
          createdAt: { gte: new Date(today.getTime() - 24 * 60 * 60_000) },
        },
      })
    )
      throw new ConflictException('A similar active requirement already exists');
    if (
      (await this.db.customerRequirement.count({
        where: { customerId, createdAt: { gte: new Date(today.toISOString().slice(0, 10)) } },
      })) >= 5
    )
      throw new ConflictException('Daily requirement limit reached');
    const city = await this.db.location.findFirst({
        where: { id: d.cityId, type: 'CITY', active: true },
      }),
      category = await this.db.category.findFirst({ where: { id: d.categoryId, active: true } });
    if (!city || !category) throw new BadRequestException('City or category is invalid');
    if (
      d.localityId &&
      !(await this.db.location.findFirst({
        where: { id: d.localityId, parentId: d.cityId, type: 'LOCALITY', active: true },
      }))
    )
      throw new BadRequestException('Locality is invalid');
    const where = {
        status: 'APPROVED' as const,
        publicVisible: true,
        categories: { some: { categoryId: d.categoryId } },
        members: {
          some: { role: 'OWNER' as const, active: true, user: { status: 'ACTIVE' as const } },
        },
        serviceAreas: {
          some: d.localityId
            ? { locationId: d.localityId }
            : { OR: [{ locationId: d.cityId }, { location: { parentId: d.cityId } }] },
        },
      },
      vendors = await this.db.vendorBusiness.findMany({
        where: {
          ...where,
          ...(d.selectedVendorIds?.length ? { id: { in: d.selectedVendorIds } } : {}),
        },
        take: 5,
        orderBy: { completionPercent: 'desc' },
        include: { members: { where: { role: 'OWNER', active: true }, select: { userId: true } } },
      }),
      expiresAt = new Date(Math.min(d.eventDate.getTime(), Date.now() + 30 * 86400_000));
    return this.db.$transaction(async (tx) => {
      const req = await tx.customerRequirement.create({
        data: {
          customerId,
          eventType: d.eventType,
          cityId: d.cityId,
          localityId: d.localityId ?? null,
          eventDate: d.eventDate,
          alternateDate: d.alternateDate ?? null,
          categoryId: d.categoryId,
          guestCount: d.guestCount ?? null,
          budgetMin: d.budgetMin ?? null,
          budgetMax: d.budgetMax ?? null,
          requiredServices: d.requiredServices,
          styleTradition: d.styleTradition ?? null,
          description: d.description,
          preferredContact: d.preferredContact,
          expiresAt,
        },
      });
      for (const v of vendors) {
        await tx.leadRecipient.create({
          data: { requirementId: req.id, businessId: v.id, expiresAt },
        });
        for (const owner of v.members)
          await tx.notificationOutbox.create({
            data: {
              requirementId: req.id,
              recipientUserId: owner.userId,
              template: 'new_lead_preview',
              payload: { leadCategory: category.name, city: city.name },
            },
          });
      }
      return { ...req, matchedVendorCount: vendors.length };
    });
  }
  myRequirements(customerId: string) {
    return this.db.customerRequirement.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        locality: true,
        category: true,
        recipients: {
          select: {
            id: true,
            businessId: true,
            status: true,
            createdAt: true,
            business: { select: { name: true, slug: true } },
          },
        },
      },
    });
  }
  async vendorLeads(userId: string, businessId: string) {
    await this.member(userId, businessId);
    const rows = await this.db.leadRecipient.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      include: {
        requirement: { include: { city: true, locality: true, category: true } },
        responses: true,
        grants: true,
      },
    });
    return rows.map((r) => this.preview(r));
  }
  async view(userId: string, businessId: string, id: string) {
    await this.recipient(userId, businessId, id);
    return this.db.leadRecipient.update({
      where: { id },
      data: { status: 'VIEWED', previewViewedAt: new Date() },
    });
  }
  async respond(userId: string, businessId: string, id: string, body: unknown) {
    const d = responseInput.parse(body),
      lead = await this.recipient(userId, businessId, id);
    if (['CLOSED', 'NOT_INTERESTED', 'INVALID', 'SPAM', 'EXPIRED'].includes(lead.status))
      throw new ConflictException('Lead is not respondable');
    return this.db.$transaction(async (tx) => {
      if (!lead.respondedAt) {
        await tx.vendorCreditAccount.upsert({
          where: { businessId },
          create: { businessId, balance: 0 },
          update: {},
        });
        const charged = await tx.vendorCreditAccount.updateMany({
          where: { businessId, balance: { gte: 1 } },
          data: { balance: { decrement: 1 } },
        });
        if (!charged.count) throw new ConflictException('Insufficient lead credits');
        const account = await tx.vendorCreditAccount.findUniqueOrThrow({ where: { businessId } });
        await tx.vendorCreditLedger.create({
          data: {
            businessId,
            recipientId: id,
            amount: -1,
            balanceAfter: account.balance,
            reason: 'LEAD_RESPONSE',
          },
        });
      }
      const response = await tx.leadResponse.create({
        data: { recipientId: id, authorUserId: userId, message: d.message },
      });
      await tx.leadRecipient.update({
        where: { id },
        data: { status: 'RESPONDED', respondedAt: lead.respondedAt ?? new Date() },
      });
      await tx.notificationOutbox.create({
        data: {
          requirementId: lead.requirementId,
          recipientUserId: lead.requirement.customerId,
          template: 'vendor_lead_response',
          payload: { businessId },
        },
      });
      return response;
    });
  }
  async grantContact(customerId: string, requirementId: string, body: unknown) {
    const d = contactGrantInput.parse(body),
      req = await this.db.customerRequirement.findFirst({
        where: { id: requirementId, customerId },
      });
    if (!req) throw new NotFoundException('Requirement not found');
    const recipient = await this.db.leadRecipient.findFirst({
      where: { id: d.recipientId, requirementId },
      include: { business: true },
    });
    if (!recipient) throw new NotFoundException('Lead recipient not found');
    if (!d.consentText.includes(recipient.business.name))
      throw new BadRequestException('Consent wording must name the receiving vendor');
    const hash = createHash('sha256').update(d.consentText).digest('hex');
    return this.db.$transaction(async (tx) => {
      const grant = await tx.leadContactGrant.create({
        data: {
          requirementId,
          recipientId: recipient.id,
          customerId,
          consentVersion: d.consentVersion,
          consentText: d.consentText,
          consentHash: hash,
          sharedFields: d.sharedFields,
        },
      });
      await tx.leadRecipient.update({
        where: { id: recipient.id },
        data: { status: 'CONTACT_SHARED' },
      });
      return grant;
    });
  }
  async revealContact(userId: string, businessId: string, id: string) {
    const lead = await this.recipient(userId, businessId, id),
      grant = await this.db.leadContactGrant.findFirst({ where: { recipientId: id } });
    if (!grant) throw new ForbiddenException('Customer has not shared contact details');
    const { data, error } = await this.auth.auth.admin.getUserById(lead.requirement.customerId);
    if (error) throw new BadRequestException('Contact is unavailable');
    return Object.fromEntries(
      grant.sharedFields.map((f) => [
        f,
        f === 'phone' ? (data.user.phone ?? null) : (data.user.email ?? null),
      ]),
    );
  }
  async status(userId: string, businessId: string, id: string, body: unknown) {
    const d = statusInput.parse(body);
    await this.recipient(userId, businessId, id);
    return this.db.leadRecipient.update({ where: { id }, data: { status: d.status } });
  }
  async reportInvalid(userId: string, businessId: string, id: string, body: unknown) {
    const d = invalidReportInput.parse(body);
    await this.recipient(userId, businessId, id);
    return this.db.leadInvalidReport.create({ data: { recipientId: id, reason: d.reason } });
  }
  async grantCredits(body: unknown) {
    const d = creditGrantInput.parse(body);
    return this.db.$transaction(async (tx) => {
      const account = await tx.vendorCreditAccount.upsert({
        where: { businessId: d.businessId },
        create: { businessId: d.businessId, balance: d.amount },
        update: { balance: { increment: d.amount } },
      });
      await tx.vendorCreditLedger.create({
        data: {
          businessId: d.businessId,
          amount: d.amount,
          balanceAfter: account.balance,
          reason: 'ADMIN_GRANT',
          reference: d.reference ?? null,
        },
      });
      return account;
    });
  }
  async refund(body: unknown) {
    const d = refundInput.parse(body),
      report = await this.db.leadInvalidReport.findUnique({
        where: { id: d.reportId },
        include: { recipient: true },
      });
    if (!report || report.status !== 'OPEN') throw new NotFoundException('Open report not found');
    return this.db.$transaction(async (tx) => {
      await tx.leadInvalidReport.update({
        where: { id: report.id },
        data: { status: d.approve ? 'APPROVED' : 'REJECTED', resolvedAt: new Date() },
      });
      if (!d.approve) return { refunded: false };
      const existing = await tx.vendorCreditLedger.findFirst({
        where: { recipientId: report.recipientId, reason: 'REFUND' },
      });
      if (existing) return { refunded: true, duplicate: true };
      const account = await tx.vendorCreditAccount.update({
        where: { businessId: report.recipient.businessId },
        data: { balance: { increment: 1 } },
      });
      await tx.vendorCreditLedger.create({
        data: {
          businessId: report.recipient.businessId,
          recipientId: report.recipientId,
          amount: 1,
          balanceAfter: account.balance,
          reason: 'REFUND',
          reference: report.id,
        },
      });
      return { refunded: true, balance: account.balance };
    });
  }
  private async member(userId: string, businessId: string) {
    if (!(await this.db.vendorMember.findFirst({ where: { userId, businessId, active: true } })))
      throw new ForbiddenException('Business access denied');
  }
  private async recipient(userId: string, businessId: string, id: string) {
    await this.member(userId, businessId);
    const lead = await this.db.leadRecipient.findFirst({
      where: { id, businessId },
      include: { requirement: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private preview(r: any) {
    const x = r.requirement;
    return {
      id: r.id,
      status: r.status,
      expiresAt: r.expiresAt,
      category: x.category,
      city: x.city,
      locality: x.locality,
      eventType: x.eventType,
      eventDate: x.eventDate,
      budgetMin: x.budgetMin,
      budgetMax: x.budgetMax,
      requiredServices: x.requiredServices,
      styleTradition: x.styleTradition,
      descriptionPreview: x.description.slice(0, 160),
      contactShared: r.grants.length > 0,
      responses: r.responses,
    };
  }
}
