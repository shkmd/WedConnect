import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { CategoriesService } from './categories.service';
import { LocationsService } from './locations.service';
import { AdminCategoriesController, AdminLocationsController, CategoriesController, LocationsController } from './taxonomy.controller';

@Module({ imports: [AuthModule], controllers: [LocationsController, CategoriesController, AdminLocationsController, AdminCategoriesController], providers: [LocationsService, CategoriesService] })
export class TaxonomyModule {}
