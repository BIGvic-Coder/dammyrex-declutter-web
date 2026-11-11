import { Controller, Get } from '@nestjs/common';
import { publicVisibleWhere } from '../common/public-item';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        _count: { select: { items: { where: publicVisibleWhere() } } },
      },
    });
    // "Others" last, everything else alphabetical
    return categories
      .map(({ _count, ...c }) => ({ ...c, itemCount: _count.items }))
      .sort((a, b) => Number(a.slug === 'others') - Number(b.slug === 'others'));
  }
}
