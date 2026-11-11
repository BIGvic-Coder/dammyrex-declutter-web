import { Controller, Get, UseGuards } from '@nestjs/common';
import { InspectionStatus, ItemStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';

const DAY = 24 * 60 * 60 * 1000;

@Controller('admin/stats')
@UseGuards(AdminGuard)
export class AdminStatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async stats() {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY);
    const next7 = new Date(now.getTime() + 7 * DAY);

    const [itemGroups, inspectionGroups, sold30, sellers, upcoming, featured] = await Promise.all([
      this.prisma.item.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.inspection.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.item.aggregate({
        where: { status: 'SOLD', soldAt: { gte: since30 } },
        _count: { _all: true },
        _sum: { price: true },
      }),
      this.prisma.seller.count(),
      this.prisma.inspection.count({
        where: { status: 'CONFIRMED', slotAt: { gte: now, lte: next7 } },
      }),
      this.prisma.item.count({ where: { featured: true, status: { in: ['AVAILABLE', 'RESERVED'] } } }),
    ]);

    const items = Object.fromEntries(Object.values(ItemStatus).map((s) => [s, 0])) as Record<ItemStatus, number>;
    for (const g of itemGroups) items[g.status] = g._count._all;

    const inspections = Object.fromEntries(
      Object.values(InspectionStatus).map((s) => [s, 0]),
    ) as Record<InspectionStatus, number>;
    for (const g of inspectionGroups) inspections[g.status] = g._count._all;

    return {
      items,
      inspections,
      soldLast30Days: { count: sold30._count._all, value: sold30._sum.price ?? 0 },
      upcomingConfirmedInspections7Days: upcoming,
      featuredLive: featured,
      sellers,
    };
  }
}
