import { Body, Controller, Get, Inject, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../identity/auth-context';
import { AuthGuard } from '../identity/auth.guard';
import { PermissionGuard, RequiresPermission } from '../identity/permission.guard';
import { VendorsService } from './vendors.service';

@Controller('vendors')
@UseGuards(AuthGuard)
export class VendorsController {
  constructor(@Inject(VendorsService) private readonly vendors: VendorsService) {}
  @Post('businesses') create(@Req() req:AuthenticatedRequest,@Body() body:unknown) { return this.vendors.create(req.auth.userId,body); }
  @Get('businesses/:id/onboarding') dashboard(@Req() req:AuthenticatedRequest,@Param('id') id:string) { return this.vendors.dashboard(req.auth.userId,id); }
  @Patch('businesses/:id') update(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.update(req.auth.userId,id,body); }
  @Put('businesses/:id/categories') categories(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.setCategories(req.auth.userId,id,body); }
  @Put('businesses/:id/service-areas') areas(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.setAreas(req.auth.userId,id,body); }
  @Post('businesses/:id/services') service(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.addService(req.auth.userId,id,body); }
  @Post('businesses/:id/packages') vendorPackage(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.addPackage(req.auth.userId,id,body); }
  @Post('businesses/:id/terms') terms(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.acceptTerms(req.auth.userId,id,body); }
  @Get('businesses/:id/preview') preview(@Req() req:AuthenticatedRequest,@Param('id') id:string) { return this.vendors.preview(req.auth.userId,id); }
  @Post('businesses/:id/submit') submit(@Req() req:AuthenticatedRequest,@Param('id') id:string) { return this.vendors.submit(req.auth.userId,id); }
}

@Controller('admin/vendor-submissions')
@UseGuards(AuthGuard,PermissionGuard)
@RequiresPermission('vendor.moderate')
export class VendorModerationController {
  constructor(@Inject(VendorsService) private readonly vendors: VendorsService) {}
  @Get() list() { return this.vendors.listSubmissions(); }
  @Post(':id/decision') decide(@Req() req:AuthenticatedRequest,@Param('id') id:string,@Body() body:unknown) { return this.vendors.moderate(req.auth.userId,id,body); }
}
