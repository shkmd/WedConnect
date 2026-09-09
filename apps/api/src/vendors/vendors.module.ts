import { Module } from '@nestjs/common';
import { AuthModule } from '../identity/auth.module';
import { VendorModerationController, VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';
@Module({imports:[AuthModule],controllers:[VendorsController,VendorModerationController],providers:[VendorsService]})
export class VendorsModule {}
