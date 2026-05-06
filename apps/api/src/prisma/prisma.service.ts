import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../../../packages/database/generated/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL is missing. Create a .env file in the project root, backend folder, or packages/database folder.'
      );
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
