import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { hasAnyField } from '../../common/transaction';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';
import { AdminListItemsQuery, AdminUpdateItemDto, AdminUpdateStatusDto } from './admin-items.dto';

/** Full item view for admins, including seller contact and private address. */
const adminItemInclude = {
  category: { select: { id: true, name: true, slug: true } },
  seller: { select: { id: true, name: true, phone: true, area: true } },
  images: { select: { id: true, url: true, position: true }, orderBy: { position: 'asc' } },
  _count: { select: { inspections: true } },
} satisfies Prisma.ItemInclude;

@Controller('admin/items')
@UseGuards(AdminGuard)
export class AdminItemsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get()
  async list(@Query() query: AdminListItemsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ItemWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.q && {
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { seller: { name: { contains: query.q, mode: 'insensitive' } } },
          { seller: { phone: { contains: query.q.replace(/\D/g, '') || query.q } } },
        ],
      }),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        include: adminItemInclude,
        // Review queue: oldest pending first; everything else: newest first
        orderBy: query.status === 'PENDING' ? { createdAt: 'asc' } : { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateItemDto) {
    if (!hasAnyField(dto)) throw new BadRequestException('Nothing to update');
    await this.ensureExists(id);
    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException('Choose a valid category');
    }
    return this.prisma.item.update({ where: { id }, data: dto, include: adminItemInclude });
  }

  @Patch(':id/status')
  async setStatus(@Param('id') id: string, @Body() dto: AdminUpdateStatusDto) {
    const item = await this.ensureExists(id);
    // soldAt drives the "visible for 7 days after sale" rule
    const soldAt =
      dto.status === 'SOLD' ? (item.status === 'SOLD' ? item.soldAt : new Date()) : null;
    return this.prisma.item.update({
      where: { id },
      data: {
        status: dto.status,
        soldAt,
        // Featuring only makes sense for live items
        ...(dto.status === 'REJECTED' || dto.status === 'PENDING' ? { featured: false } : {}),
      },
      include: adminItemInclude,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ensureExists(id);
    const images = await this.prisma.itemImage.findMany({ where: { itemId: id }, select: { url: true } });
    await this.prisma.item.delete({ where: { id } }); // cascades images + inspections
    await Promise.all(images.map((img) => this.cloudinary.deleteByUrl(img.url)));
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: { id: true, status: true, soldAt: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
