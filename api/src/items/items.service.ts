import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { publicItemSelect, publicVisibleWhere } from '../common/public-item';
import { TX_OPTIONS } from '../common/transaction';
import { PrismaService } from '../prisma/prisma.service';
import { ListItemsQuery } from './dto/list-items.query';
import { SubmitItemDto } from './dto/submit-item.dto';

export const MAX_IMAGES = 8;
const DEFAULT_LIMIT = 12;

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(query: ListItemsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const and: Prisma.ItemWhereInput[] = [publicVisibleWhere()];
    if (query.category) and.push({ category: { slug: query.category } });
    if (query.minPrice != null || query.maxPrice != null) {
      and.push({ price: { gte: query.minPrice, lte: query.maxPrice } });
    }
    if (query.area) and.push({ area: { contains: query.area, mode: 'insensitive' } });
    if (query.condition) and.push({ condition: query.condition });
    if (query.featured) and.push({ featured: true });
    if (query.q) {
      and.push({
        OR: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { description: { contains: query.q, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.ItemWhereInput = { AND: and };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        select: publicItemSelect,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findPublic(id: string) {
    const item = await this.prisma.item.findFirst({
      where: { AND: [{ id }, publicVisibleWhere()] },
      select: publicItemSelect,
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async submit(dto: SubmitItemDto, files: Express.Multer.File[] = []) {
    if (files.length < 1) throw new BadRequestException('Add at least one photo');
    if (files.length > MAX_IMAGES) throw new BadRequestException(`Maximum ${MAX_IMAGES} photos`);

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Choose a valid category');

    // Upload all photos first; if any fail, clean up the ones that succeeded.
    const results = await Promise.allSettled(files.map((f) => this.cloudinary.upload(f)));
    const urls = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (urls.length !== files.length) {
      await Promise.all(urls.map((u) => this.cloudinary.deleteByUrl(u)));
      const failure = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      throw failure.reason;
    }

    try {
      const item = await this.prisma.$transaction(async (tx) => {
        const seller = await tx.seller.upsert({
          where: { phone: dto.sellerPhone },
          update: { name: dto.sellerName, area: dto.area },
          create: { name: dto.sellerName, phone: dto.sellerPhone, area: dto.area },
        });
        return tx.item.create({
          data: {
            title: dto.title,
            description: dto.description,
            price: dto.price,
            condition: dto.condition,
            area: dto.area,
            addressPrivate: dto.addressPrivate,
            status: 'PENDING',
            categoryId: category.id,
            sellerId: seller.id,
            images: { create: urls.map((url, position) => ({ url, position })) },
          },
          select: { id: true, status: true },
        });
      }, TX_OPTIONS);
      return {
        id: item.id,
        status: item.status,
        message: 'Thanks! Your item has been received and will be posted after review.',
      };
    } catch (e) {
      await Promise.all(urls.map((u) => this.cloudinary.deleteByUrl(u)));
      throw e;
    }
  }
}
