import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_ATTEMPTS = 5;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Neon's free tier auto-suspends the database when idle; the first connection after
   * that can take several seconds. Retry with backoff instead of crashing on boot.
   */
  async onModuleInit() {
    for (let attempt = 1; ; attempt++) {
      try {
        await this.$connect();
        if (attempt > 1) this.logger.log(`Connected to database on attempt ${attempt}`);
        return;
      } catch (e) {
        if (attempt >= CONNECT_ATTEMPTS) throw e;
        const waitMs = attempt * 2000;
        this.logger.warn(`Database not reachable (attempt ${attempt}/${CONNECT_ATTEMPTS}), retrying in ${waitMs / 1000}s`);
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
