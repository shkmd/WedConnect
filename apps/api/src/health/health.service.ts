import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Client } from 'pg';
import type { DependencyCheck } from './health.types';

@Injectable()
export class HealthService implements OnApplicationShutdown {
  async dependencies(): Promise<DependencyCheck[]> { return [await this.checkPostgres()]; }
  async onApplicationShutdown(): Promise<void> {}
  private async checkPostgres(): Promise<DependencyCheck> {
    const url = process.env.DATABASE_URL;
    if (!url) return { name: 'postgres', status: 'not_configured' };
    const started = Date.now();
    const client = new Client({ connectionString: url, connectionTimeoutMillis: 1_000 });
    try { await client.connect(); await client.query('SELECT 1'); return { name: 'postgres', status: 'up', latencyMs: Date.now() - started }; }
    catch { return { name: 'postgres', status: 'down', latencyMs: Date.now() - started }; }
    finally { await client.end().catch(() => undefined); }
  }
}
