import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}
  @Get('live') @ApiOkResponse({ description: 'Process is alive' })
  live(): { status: 'ok'; service: 'api' } { return { status: 'ok', service: 'api' }; }
  @Get('ready') @ApiOkResponse({ description: 'Required dependencies are healthy' }) @ApiServiceUnavailableResponse({ description: 'A required dependency is unavailable' })
  async ready(): Promise<{ status: 'ready'; checks: Awaited<ReturnType<HealthService['dependencies']>> }> {
    const checks = await this.health.dependencies();
    if (checks.some((check) => check.status === 'down')) throw new ServiceUnavailableException({ status: 'not_ready', checks });
    return { status: 'ready', checks };
  }
}
