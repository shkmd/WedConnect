import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { searchQuery, sponsoredInput } from './discovery.schemas';
@Injectable()
export class DiscoveryService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  async cities() {
    const cities = await this.db.location.findMany({
      where: { type: 'CITY', active: true },
      orderBy: { name: 'asc' },
    });
    return Promise.all(
      cities.map(async (city) => ({
        ...city,
        vendorCount: await this.db.vendorBusiness.count({
          where: this.eligible({
            serviceAreas: {
              some: { OR: [{ locationId: city.id }, { location: { parentId: city.id } }] },
            },
          }),
        }),
      })),
    );
  }
  async categories(citySlug?: string) {
    const city = citySlug ? await this.city(citySlug) : null,
      categories = await this.db.category.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      });
    return Promise.all(
      categories.map(async (category) => ({
        ...category,
        vendorCount: await this.db.vendorBusiness.count({
          where: this.eligible({
            categories: { some: { categoryId: category.id } },
            ...(city
              ? {
                  serviceAreas: {
                    some: { OR: [{ locationId: city.id }, { location: { parentId: city.id } }] },
                  },
                }
              : {}),
          }),
        }),
      })),
    );
  }
  async search(raw: unknown) {
    const q = searchQuery.parse(raw),
      city = await this.city(q.city),
      category = await this.db.category.findUnique({ where: { slug: q.category } });
    if (!category || !category.active) throw new NotFoundException('Category not found');
    const locality = q.locality
      ? await this.db.location.findFirst({
          where: { slug: q.locality, parentId: city.id, type: 'LOCALITY', active: true },
        })
      : null;
    if (q.locality && !locality) throw new NotFoundException('Locality not found');
    let fields: Record<string, unknown> = {};
    if (q.fieldFilters) {
      try {
        fields = JSON.parse(q.fieldFilters) as Record<string, unknown>;
      } catch {
        throw new BadRequestException('fieldFilters must be JSON');
      }
    }
    const serviceArea = locality
      ? { serviceAreas: { some: { locationId: locality.id } } }
      : {
          serviceAreas: {
            some: { OR: [{ locationId: city.id }, { location: { parentId: city.id } }] },
          },
        };
    const where = this.eligible({
      ...serviceArea,
      categories: { some: { categoryId: category.id } },
      ...(q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: 'insensitive' } },
              { description: { contains: q.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.outstation != null ? { outstationAvailable: q.outstation } : {}),
      ...(q.languages?.length ? { languages: { hasSome: q.languages } } : {}),
      ...(q.minPrice != null || q.maxPrice != null
        ? {
            services: {
              some: {
                categoryId: category.id,
                active: true,
                price: {
                  ...(q.minPrice != null ? { gte: q.minPrice } : {}),
                  ...(q.maxPrice != null ? { lte: q.maxPrice } : {}),
                },
              },
            },
          }
        : {}),
      ...(q.rating != null
        ? { discoveryProfile: { is: { averageRating: { gte: q.rating } } } }
        : {}),
      ...(q.verified != null ? { discoveryProfile: { is: { verified: q.verified } } } : {}),
      ...(q.tradition ? { discoveryProfile: { is: { traditions: { has: q.tradition } } } } : {}),
      ...(q.style ? { discoveryProfile: { is: { styles: { has: q.style } } } } : {}),
    });
    const rows = await this.db.vendorBusiness.findMany({
        where,
        take: 100,
        include: {
          baseCity: true,
          discoveryProfile: true,
          categories: { include: { category: true } },
          services: { where: { categoryId: category.id, active: true } },
          serviceAreas: { include: { location: true } },
          categoryFieldValues: { where: { categoryId: category.id } },
          _count: { select: { portfolioPosts: { where: { publicationStatus: 'PUBLISHED' } } } },
        },
      }),
      filtered = rows.filter((r) =>
        Object.entries(fields).every(([key, value]) => {
          const stored = r.categoryFieldValues.find((x) => x.fieldKey === key)?.value;
          return Array.isArray(stored) ? stored.includes(value as never) : stored === value;
        }),
      ),
      scored = filtered.map((r) => {
        const primary = r.categories.some((x) => x.categoryId === category.id && x.isPrimary),
          local = r.serviceAreas.some((x) => x.locationId === locality?.id),
          profile = r.discoveryProfile,
          score =
            30 +
            (local ? 15 : 0) +
            (primary ? 20 : 10) +
            Math.round(r.completionPercent / 10) +
            (profile?.verified ? 8 : 0) +
            Number(profile?.averageRating ?? 0) * 3 +
            Math.min(r._count.portfolioPosts, 5) * 2 +
            Math.round((profile?.responseRate ?? 0) / 20);
        return { ...this.safe(r), score, startingPrice: this.startingPrice(r.services) };
      });
    const sorted = scored.sort((a, b) =>
        q.sort === 'rating'
          ? b.rating - a.rating
          : q.sort === 'price'
            ? (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity)
            : q.sort === 'recent'
              ? b.lastActiveAt.localeCompare(a.lastActiveAt)
              : b.score - a.score,
      ),
      start = (q.page - 1) * q.limit,
      organic = sorted.slice(start, start + q.limit),
      sponsored = await this.sponsored(city.id, category.id);
    return {
      sponsored,
      organic,
      meta: {
        page: q.page,
        limit: q.limit,
        total: sorted.length,
        eventDate: q.eventDate ?? null,
        shareableQuery: q,
      },
    };
  }
  async vendor(citySlug: string, categorySlug: string, vendorSlug: string) {
    const result = await this.db.vendorBusiness.findFirst({
      where: this.eligible({
        slug: vendorSlug,
        categories: { some: { category: { slug: categorySlug } } },
        serviceAreas: {
          some: {
            OR: [{ location: { slug: citySlug } }, { location: { parent: { slug: citySlug } } }],
          },
        },
      }),
      include: {
        baseCity: true,
        discoveryProfile: true,
        categories: { include: { category: true } },
        serviceAreas: { include: { location: true } },
        services: { where: { active: true } },
        packages: { where: { active: true } },
      },
    });
    if (!result) throw new NotFoundException('Vendor not found');
    return this.safe(result);
  }
  createSponsored(body: unknown) {
    const d = sponsoredInput.parse(body);
    return this.db.vendorSponsoredPlacement.create({
      data: d as unknown as Prisma.VendorSponsoredPlacementUncheckedCreateInput,
    });
  }
  private eligible(extra: Prisma.VendorBusinessWhereInput): Prisma.VendorBusinessWhereInput {
    return {
      status: 'APPROVED',
      publicVisible: true,
      members: { some: { role: 'OWNER', active: true, user: { status: 'ACTIVE' } } },
      ...extra,
    };
  }
  private city(slug: string) {
    return this.db.location.findFirstOrThrow({ where: { slug, type: 'CITY', active: true } });
  }
  private startingPrice(services: { price: unknown }[]) {
    const nums = services.map((x) => Number(x.price)).filter(Number.isFinite);
    return nums.length ? Math.min(...nums) : null;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private safe(r: any) {
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      yearsExperience: r.yearsExperience,
      languages: r.languages,
      outstationAvailable: r.outstationAvailable,
      baseCity: r.baseCity,
      categories: r.categories,
      serviceAreas: r.serviceAreas,
      services: r.services,
      packages: r.packages,
      verified: r.discoveryProfile?.verified ?? false,
      verificationScope: r.discoveryProfile?.verificationScope ?? [],
      rating: Number(r.discoveryProfile?.averageRating ?? 0),
      reviewCount: r.discoveryProfile?.reviewCount ?? 0,
      responseRate: r.discoveryProfile?.responseRate ?? 0,
      lastActiveAt: (r.discoveryProfile?.lastActiveAt ?? r.updatedAt).toISOString(),
    };
  }
  private async sponsored(cityId: string, categoryId: string) {
    const now = new Date(),
      placements = await this.db.vendorSponsoredPlacement.findMany({
        where: {
          cityId,
          categoryId,
          active: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
          OR: [
            { impressionDate: { lt: new Date(now.toISOString().slice(0, 10)) } },
            {
              impressionsToday: { lt: this.db.vendorSponsoredPlacement.fields.dailyImpressionCap },
            },
          ],
        },
        take: 3,
        include: {
          business: {
            include: {
              baseCity: true,
              discoveryProfile: true,
              categories: { include: { category: true } },
              serviceAreas: { include: { location: true } },
              services: { where: { active: true } },
              packages: { where: { active: true } },
              members: { include: { user: true } },
            },
          },
        },
      });
    const valid = placements.filter(
      (p) =>
        p.business.status === 'APPROVED' &&
        p.business.publicVisible &&
        p.business.members.some(
          (m) => m.role === 'OWNER' && m.active && m.user.status === 'ACTIVE',
        ),
    );
    await Promise.all(
      valid.map((p) =>
        this.db.vendorSponsoredPlacement.update({
          where: { id: p.id },
          data:
            p.impressionDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10)
              ? { impressionDate: now, impressionsToday: 1 }
              : { impressionsToday: { increment: 1 } },
        }),
      ),
    );
    return valid.map((p) => ({ ...this.safe(p.business), label: 'Sponsored', placementId: p.id }));
  }
}
