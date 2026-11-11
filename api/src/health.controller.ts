import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Full check: API + database. Use for manual checks. */
  @Get('health')
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  }

  /**
   * Liveness only, no database query. Used by Render's health check and the uptime pinger
   * that keeps the free Render instance awake, without also keeping Neon awake (and using up
   * its free compute hours).
   */
  @Get('ping')
  ping() {
    return { ok: true };
  }
}
