import { Controller, Get, HttpCode, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { ClientIpThrottlerGuard } from '../common/client-ip-throttler.guard';
import { PrismaService } from '../prisma/prisma.service';

/** Running right now: not paused and inside its start/end dates. */
export function activeAdWhere(now = new Date()): Prisma.AdWhereInput {
  return { paused: false, startsAt: { lte: now }, endsAt: { gte: now } };
}

/** Public ad routes. Only active ads are ever returned or counted. */
@Controller('ads')
export class AdsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Every active ad (all placements) plus the AdSense switch, in one small response
   * the website caches for a few minutes. linkUrl is not exposed: clicks go through /ads/:id/click.
   */
  @Get()
  async list() {
    const [ads, settings] = await Promise.all([
      this.prisma.ad.findMany({
        where: activeAdWhere(),
        select: { id: true, advertiser: true, headline: true, imageDesktop: true, imageMobile: true, placement: true, endsAt: true },
        orderBy: { createdAt: 'asc' },
        take: 60,
      }),
      this.prisma.siteSetting.findUnique({ where: { id: 1 } }),
    ]);
    return { ads, adsenseEnabled: settings?.adsenseEnabled ?? false };
  }

  /** Counted by the website when at least half the ad is on screen (once per page view). */
  @Post(':id/impression')
  @HttpCode(204)
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({ default: { limit: 120, ttl: 60 * 1000 } })
  async impression(@Param('id') id: string) {
    await this.prisma.ad.updateMany({ where: { id, ...activeAdWhere() }, data: { impressions: { increment: 1 } } });
  }

  /** Counts the click, then sends the visitor to the advertiser. */
  @Get(':id/click')
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60 * 1000 } })
  async click(@Param('id') id: string, @Res() res: Response) {
    const ad = await this.prisma.ad.findUnique({ where: { id }, select: { linkUrl: true } });
    if (!ad) throw new NotFoundException('Ad not found');
    await this.prisma.ad.updateMany({ where: { id, ...activeAdWhere() }, data: { clicks: { increment: 1 } } });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.redirect(302, ad.linkUrl);
  }
}
