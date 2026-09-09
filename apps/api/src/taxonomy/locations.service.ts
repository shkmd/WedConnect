import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LocationType, Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { locationInput, locationPatch } from './taxonomy.schemas';

const parentType: Record<LocationType, LocationType | null> = { COUNTRY: null, STATE: 'COUNTRY', DISTRICT: 'STATE', CITY: 'DISTRICT', LOCALITY: 'CITY' };

@Injectable()
export class LocationsService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  list(parentId?: string) { return this.db.location.findMany({ where: parentId ? { parentId, active: true } : { type: 'COUNTRY', active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }); }
  async city(slug: string) { const row = await this.db.location.findFirst({ where: { slug, type: 'CITY', active: true } }); if (!row) throw new NotFoundException('City not found'); return row; }
  async localities(slug: string) { return this.list((await this.city(slug)).id); }
  async create(body: unknown) { const data = locationInput.parse(body); await this.validateParent(data.type, data.parentId); return this.db.location.create({ data: data as unknown as Prisma.LocationUncheckedCreateInput }); }
  async update(id: string, body: unknown) { const data = locationPatch.parse(body); const current = await this.db.location.findUnique({ where: { id } }); if (!current) throw new NotFoundException('Location not found'); await this.validateParent(data.type ?? current.type, data.parentId === undefined ? current.parentId : data.parentId); return this.db.location.update({ where: { id }, data: data as unknown as Prisma.LocationUncheckedUpdateInput }); }
  private async validateParent(type: LocationType, parentId?: string | null) {
    const expected = parentType[type];
    if (!expected && parentId) throw new BadRequestException('Country cannot have a parent');
    if (expected && !parentId) throw new BadRequestException(`${type} requires a ${expected} parent`);
    if (parentId) { const parent = await this.db.location.findUnique({ where: { id: parentId } }); if (!parent || parent.type !== expected) throw new BadRequestException(`Parent must be ${expected}`); }
  }
}
