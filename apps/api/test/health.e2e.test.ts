import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { HealthModule } from '../src/health/health.module';

describe('health endpoints', () => {
  let app: INestApplication;
  beforeAll(async () => {
    delete process.env.DATABASE_URL;
    const moduleRef = await Test.createTestingModule({ imports: [HealthModule] }).compile();
    app = moduleRef.createNestApplication(); app.setGlobalPrefix('api/v1'); await app.init();
  });
  afterAll(async () => app.close());
  it('reports liveness', async () => { await request(app.getHttpServer()).get('/api/v1/health/live').expect(200, { status: 'ok', service: 'api' }); });
  it('reports isolated readiness', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    expect(response.body).toEqual({ status: 'ready', checks: [{ name: 'postgres', status: 'not_configured' }] });
  });
});
