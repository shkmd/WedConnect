import { Body, Controller, Get, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../identity/auth.guard';
import { PermissionGuard, RequiresPermission } from '../identity/permission.guard';
import { CategoriesService } from './categories.service';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(@Inject(LocationsService) private readonly locations: LocationsService) {}
  @Get('countries') countries() { return this.locations.list(); }
  @Get(':parentId/children') children(@Param('parentId') parentId: string) { return this.locations.list(parentId); }
  @Get('cities/:slug') city(@Param('slug') slug: string) { return this.locations.city(slug); }
  @Get('cities/:slug/localities') localities(@Param('slug') slug: string) { return this.locations.localities(slug); }
}

@Controller('categories')
export class CategoriesController {
  constructor(@Inject(CategoriesService) private readonly categories: CategoriesService) {}
  @Get() list() { return this.categories.list(); }
  @Get(':slug/fields') fields(@Param('slug') slug: string) { return this.categories.fields(slug); }
  @Get(':slug') one(@Param('slug') slug: string) { return this.categories.one(slug); }
}

@Controller('admin/locations')
@UseGuards(AuthGuard, PermissionGuard)
@RequiresPermission('locations.manage')
export class AdminLocationsController {
  constructor(@Inject(LocationsService) private readonly locations: LocationsService) {}
  @Post() create(@Body() body: unknown) { return this.locations.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) { return this.locations.update(id, body); }
}

@Controller('admin/categories')
@UseGuards(AuthGuard, PermissionGuard)
@RequiresPermission('taxonomy.manage')
export class AdminCategoriesController {
  constructor(@Inject(CategoriesService) private readonly categories: CategoriesService) {}
  @Post() create(@Body() body: unknown) { return this.categories.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: unknown) { return this.categories.update(id, body); }
  @Post(':id/fields') addField(@Param('id') id: string, @Body() body: unknown) { return this.categories.addField(id, body); }
  @Patch('fields/:id/archive') archive(@Param('id') id: string) { return this.categories.archiveField(id); }
}
