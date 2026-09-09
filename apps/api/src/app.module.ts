import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { AuthModule } from './identity/auth.module';
import { ConsentModule } from './identity/consent.module';
import { DatabaseModule } from './platform/database.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { VendorsModule } from './vendors/vendors.module';
import { MediaModule } from './media/media.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { LeadsModule } from './leads/leads.module';
import { ShortlistsModule } from './shortlists/shortlists.module';
import { TrustModule } from './trust/trust.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GovernanceModule } from './governance/governance.module';
import { DashboardModule } from './dashboard/dashboard.module';
@Module({ imports: [DatabaseModule, HealthModule, AuthModule, ConsentModule, TaxonomyModule, VendorsModule, MediaModule, DiscoveryModule, LeadsModule, ShortlistsModule, TrustModule, BillingModule, NotificationsModule, GovernanceModule, DashboardModule] })
export class AppModule {}
