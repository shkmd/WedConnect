import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is missing');
    super({ adapter: new PrismaPg({ connectionString }) });
  }
  async onModuleInit(): Promise<void> { await this.$connect(); }
  async onApplicationShutdown(): Promise<void> { await this.$disconnect(); }
}
