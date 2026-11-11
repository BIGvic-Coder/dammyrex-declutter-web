import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Friendly root so opening the API address in a browser doesn't look broken. */
  @Get()
  root() {
    return { name: 'DammyRex Declutter API', ok: true, health: '/health' };
  }

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
