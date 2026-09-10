import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}

  async customer(userId: string) {
    const [user, shortlists, requirements] = await Promise.all([
      this.db.appUser.findUniqueOrThrow({ where: { id: userId }, select: { displayName: true, createdAt: true } }),
      this.db.customerShortlist.findMany({ where: { customerId: userId }, orderBy: { updatedAt: 'desc' }, take: 5, include: { _count: { select: { items: true } } } }),
      this.db.customerRequirement.findMany({ where: { customerId: userId }, orderBy: { createdAt: 'desc' }, take: 5, include: { city: { select: { name: true } }, category: { select: { name: true } }, recipients: { select: { status: true, respondedAt: true } } } }),
    ]);
    return {
      profile: { displayName: user.displayName, memberSince: user.createdAt },
      metrics: {
        savedVendors: shortlists.reduce((total, list) => total + list._count.items, 0),
        shortlists: shortlists.length,
        activeRequirements: requirements.filter((item) => item.status === 'ACTIVE').length,
        vendorReplies: requirements.flatMap((item) => item.recipients).filter((item) => item.respondedAt).length,
      },
      shortlists: shortlists.map((item) => ({ id: item.id, name: item.name, eventLabel: item.eventLabel, cityLabel: item.cityLabel, vendors: item._count.items, updatedAt: item.updatedAt })),
      requirements: requirements.map((item) => ({ id: item.id, eventType: item.eventType, eventDate: item.eventDate, city: item.city.name, category: item.category.name, status: item.status, recipients: item.recipients.length, replies: item.recipients.filter((recipient) => recipient.respondedAt).length })),
    };
  }

  async vendor(userId: string) {
    const membership = await this.db.vendorMember.findFirst({ where: { userId, active: true }, orderBy: { createdAt: 'asc' }, include: { business: { include: { creditAccount: true, _count: { select: { portfolioPosts: true, reviews: true, verificationBadges: true } } } } } });
    if (!membership) throw new NotFoundException('No vendor business is linked to this account');
    const business = membership.business;
    const [totalLeads, newLeads, responses] = await Promise.all([
      this.db.leadRecipient.count({ where: { businessId: business.id } }),
      this.db.leadRecipient.count({ where: { businessId: business.id, status: 'NEW' } }),
      this.db.leadRecipient.count({ where: { businessId: business.id, respondedAt: { not: null } } }),
    ]);
    const leads = await this.db.leadRecipient.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' }, take: 8, include: { requirement: { include: { city: { select: { name: true } }, category: { select: { name: true } } } } } });
    return {
      business: { id: business.id, name: business.name, slug: business.slug, status: business.status, completionPercent: business.completionPercent, publicVisible: business.publicVisible },
      metrics: { newLeads, totalLeads, responses, credits: business.creditAccount?.balance ?? 0, portfolioPosts: business._count.portfolioPosts, reviews: business._count.reviews, badges: business._count.verificationBadges },
      leads: leads.map((lead) => ({ id: lead.id, status: lead.status, eventType: lead.requirement.eventType, eventDate: lead.requirement.eventDate, city: lead.requirement.city.name, category: lead.requirement.category.name, budgetMin: lead.requirement.budgetMin?.toString() ?? null, budgetMax: lead.requirement.budgetMax?.toString() ?? null, createdAt: lead.createdAt })),
    };
  }

  async admin(userId: string) {
    const permitted = await this.db.userRole.findFirst({ where: { userId, revokedAt: null, role: { permissions: { some: { permission: { code: { in: ['trust.moderate', 'vendor.moderate', 'analytics.read'] } } } } } } });
    if (!permitted) throw new ForbiddenException('Admin dashboard permission required');
    const [pendingVendors, openReports, openGrievances, pendingReviews, pendingMedia, privacyRequests, users, requirements] = await Promise.all([
      this.db.vendorBusiness.count({ where: { status: 'SUBMITTED' } }), this.db.trustReport.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }), this.db.grievance.count({ where: { status: { in: ['OPEN', 'REVIEWING'] } } }), this.db.vendorReview.count({ where: { status: 'PENDING' } }), this.db.mediaAsset.count({ where: { moderationStatus: 'PENDING' } }), this.db.privacyRequest.count({ where: { status: { in: ['OPEN', 'VERIFYING', 'PROCESSING'] } } }), this.db.appUser.count(), this.db.customerRequirement.count(),
    ]);
    return { metrics: { pendingVendors, openReports, openGrievances, pendingReviews, pendingMedia, privacyRequests, users, requirements }, queue: [{ type: 'Vendor submissions', count: pendingVendors, href: '/admin/trust' }, { type: 'Trust reports', count: openReports, href: '/admin/trust' }, { type: 'Grievances', count: openGrievances, href: '/admin/trust' }, { type: 'Review moderation', count: pendingReviews, href: '/admin/trust' }, { type: 'Media moderation', count: pendingMedia, href: '/admin/trust' }, { type: 'Privacy requests', count: privacyRequests, href: '/admin/trust' }] };
  }
}
