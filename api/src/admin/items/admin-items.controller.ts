import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import { ImagesInterceptor, MAX_IMAGES } from '../../common/image-upload';
import { hasAnyField, TX_OPTIONS } from '../../common/transaction';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';
import {
  AdminCreateItemDto,
  AdminListItemsQuery,
  AdminUpdateItemDto,
  AdminUpdateStatusDto,
} from './admin-items.dto';

/** Seller record used for items DammyRex owns itself (no outside seller). */
const IN_HOUSE_SELLER_NAME = 'DammyRex (own stock)';
const FALLBACK_BUSINESS_PHONE = '2348101295489';

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
    private readonly config: ConfigService,
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

  /**
   * The CEO posts an item directly. Unlike the public /items/submit form (which always
   * lands in the review queue), this goes live immediately unless status=PENDING is sent.
   */
  @Post()
  @UseInterceptors(ImagesInterceptor())
  async create(@Body() dto: AdminCreateItemDto, @UploadedFiles() files: Express.Multer.File[] = []) {
    if (files.length < 1) throw new BadRequestException('Add at least one photo');
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Choose a valid category');

    const urls = await this.cloudinary.uploadMany(files);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const seller = dto.sellerPhone
          ? await tx.seller.upsert({
              where: { phone: dto.sellerPhone },
              update: dto.sellerName ? { name: dto.sellerName } : {},
              create: { name: dto.sellerName ?? 'Seller', phone: dto.sellerPhone, area: dto.area },
            })
          : await tx.seller.upsert({
              where: { phone: this.businessPhone() },
              update: {},
              create: { name: IN_HOUSE_SELLER_NAME, phone: this.businessPhone(), area: dto.area },
            });
        const status = dto.status ?? 'AVAILABLE';
        return tx.item.create({
          data: {
            title: dto.title,
            description: dto.description,
            price: dto.price,
            condition: dto.condition,
            area: dto.area,
            addressPrivate: dto.addressPrivate,
            status,
            featured: status === 'AVAILABLE' && Boolean(dto.featured),
            categoryId: category.id,
            sellerId: seller.id,
            images: { create: urls.map((url, position) => ({ url, position })) },
          },
          include: adminItemInclude,
        });
      }, TX_OPTIONS);
    } catch (e) {
      await this.cloudinary.deleteMany(urls);
      throw e;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.prisma.item.findUnique({ where: { id }, include: adminItemInclude });
    if (!item) throw new NotFoundException('Item not found');
    return item;
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

  /** Add photos to an existing item (appended after the current ones). */
  @Post(':id/images')
  @UseInterceptors(ImagesInterceptor())
  async addImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[] = []) {
    await this.ensureExists(id);
    if (files.length < 1) throw new BadRequestException('Choose at least one photo');
    const existing = await this.prisma.itemImage.findMany({ where: { itemId: id }, select: { position: true } });
    if (existing.length + files.length > MAX_IMAGES) {
      throw new BadRequestException(`An item can have at most ${MAX_IMAGES} photos (it has ${existing.length})`);
    }
    const urls = await this.cloudinary.uploadMany(files);
    const start = existing.reduce((m, i) => Math.max(m, i.position + 1), 0);
    try {
      await this.prisma.itemImage.createMany({
        data: urls.map((url, i) => ({ itemId: id, url, position: start + i })),
      });
    } catch (e) {
      await this.cloudinary.deleteMany(urls);
      throw e;
    }
    return this.findOne(id);
  }

  /** Remove one photo. The last photo can't be removed (every listing needs a picture). */
  @Delete(':id/images/:imageId')
  async removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    const images = await this.imagesOf(id);
    const target = images.find((i) => i.id === imageId);
    if (!target) throw new NotFoundException('Photo not found');
    if (images.length === 1) throw new BadRequestException('An item needs at least one photo. Add another before removing this one.');
    await this.prisma.itemImage.delete({ where: { id: imageId } });
    await this.reorder(images.filter((i) => i.id !== imageId).map((i) => i.id));
    await this.cloudinary.deleteByUrl(target.url);
    return this.findOne(id);
  }

  /** Make a photo the cover (first) image. */
  @Patch(':id/images/:imageId/cover')
  async setCover(@Param('id') id: string, @Param('imageId') imageId: string) {
    const images = await this.imagesOf(id);
    if (!images.some((i) => i.id === imageId)) throw new NotFoundException('Photo not found');
    await this.reorder([imageId, ...images.filter((i) => i.id !== imageId).map((i) => i.id)]);
    return this.findOne(id);
  }

  private async imagesOf(itemId: string) {
    await this.ensureExists(itemId);
    return this.prisma.itemImage.findMany({ where: { itemId }, orderBy: { position: 'asc' } });
  }

  /** Rewrite positions 0..n-1 in the given order (two passes to dodge the unique [itemId, position]). */
  private reorder(imageIds: string[]) {
    return this.prisma.$transaction([
      ...imageIds.map((id, i) => this.prisma.itemImage.update({ where: { id }, data: { position: 1000 + i } })),
      ...imageIds.map((id, i) => this.prisma.itemImage.update({ where: { id }, data: { position: i } })),
    ]);
  }

  private businessPhone() {
    const digits = (this.config.get<string>('WHATSAPP_NUMBER') ?? '').replace(/\D/g, '');
    return /^234\d{10}$/.test(digits) ? digits : FALLBACK_BUSINESS_PHONE;
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
