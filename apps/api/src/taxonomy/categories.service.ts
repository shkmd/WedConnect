import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { categoryInput, categoryPatch, fieldInput } from './taxonomy.schemas';

@Injectable()
export class CategoriesService {
  constructor(@Inject(PrismaService) private readonly db: PrismaService) {}
  list() { return this.db.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { children: { where: { active: true }, orderBy: { sortOrder: 'asc' } } } }); }
  async one(slug: string) { const row = await this.db.category.findUnique({ where: { slug }, include: { children: { where: { active: true } } } }); if (!row || !row.active) throw new NotFoundException('Category not found'); return row; }
  async fields(slug: string) { const category = await this.one(slug); return this.db.categoryFieldDefinition.findMany({ where: { categoryId: category.id, status: 'ACTIVE' }, orderBy: [{ key: 'asc' }, { version: 'desc' }] }); }
  create(body: unknown) { return this.db.category.create({ data: categoryInput.parse(body) as unknown as Prisma.CategoryUncheckedCreateInput }); }
  async update(id: string, body: unknown) { await this.exists(id); return this.db.category.update({ where: { id }, data: categoryPatch.parse(body) as unknown as Prisma.CategoryUncheckedUpdateInput }); }
  async addField(categoryId: string, body: unknown) {
    await this.exists(categoryId); const data = fieldInput.parse(body);
    return this.db.$transaction(async (tx) => {
      const latest = await tx.categoryFieldDefinition.findFirst({ where: { categoryId, key: data.key }, orderBy: { version: 'desc' } });
      if (data.status === 'ACTIVE') await tx.categoryFieldDefinition.updateMany({ where: { categoryId, key: data.key, status: 'ACTIVE' }, data: { status: 'ARCHIVED' } });
      return tx.categoryFieldDefinition.create({ data: { ...data, categoryId, version: (latest?.version ?? 0) + 1 } as unknown as Prisma.CategoryFieldDefinitionUncheckedCreateInput });
    });
  }
  async archiveField(id: string) { if (!await this.db.categoryFieldDefinition.findUnique({ where: { id } })) throw new NotFoundException('Field definition not found'); return this.db.categoryFieldDefinition.update({ where: { id }, data: { status: 'ARCHIVED' } }); }
  private async exists(id: string) { if (!await this.db.category.findUnique({ where: { id } })) throw new NotFoundException('Category not found'); }
}
