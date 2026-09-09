import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth-context';
import { ConsentService } from './consent.service';
import { PermissionGuard, RequiresPermission } from './permission.guard';

@ApiTags('consent') @ApiBearerAuth() @Controller('consent')
@UseGuards(AuthGuard, PermissionGuard) @RequiresPermission('consent.self.manage')
export class ConsentController {
  constructor(@Inject(ConsentService) private readonly consent: ConsentService) {}
  @Get() history(@Req() request: AuthenticatedRequest) { return this.consent.history(request.auth.userId); }
  @Post() grant(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return this.consent.grant(request.auth.userId, body); }
  @Post(':id/withdraw') withdraw(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: { source?: string }) { return this.consent.withdraw(request.auth.userId, id, body.source === 'mobile' ? 'mobile' : 'web'); }
}
