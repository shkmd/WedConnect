import { Controller, Get, Inject, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from '../identity/auth-context';
import { AuthGuard } from '../identity/auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}
  @Get('customer') customer(@Req() request: AuthenticatedRequest) { return this.dashboard.customer(request.auth.userId); }
  @Get('vendor') vendor(@Req() request: AuthenticatedRequest) { return this.dashboard.vendor(request.auth.userId); }
  @Get('admin') admin(@Req() request: AuthenticatedRequest) { return this.dashboard.admin(request.auth.userId); }
}
