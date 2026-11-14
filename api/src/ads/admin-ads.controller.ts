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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminGuard } from '../admin/auth/admin.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AdImageFiles, AdImagesInterceptor } from '../common/image-upload';
import { hasAnyField } from '../common/transaction';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto, UpdateAdDto, UpdateSettingsDto } from './ads.dto';

const AD_FOLDER = 'dammyrex/ads';

/** CEO-only ad management. Same protection as items: every route needs the admin token. */
@Controller('admin/ads')
@UseGuards(AdminGuard)
export class AdminAdsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get()
  list() {
    return this.prisma.ad.findMany({ orderBy: [{ endsAt: 'desc' }, { createdAt: 'desc' }] });
  }

  @Post()
  @UseInterceptors(AdImagesInterceptor())
  async create(@Body() dto: CreateAdDto, @UploadedFiles() files: AdImageFiles = {}) {
    checkDates(dto.startsAt, dto.endsAt);
    const desktop = files.imageDesktop?.[0];
    if (!desktop) throw new BadRequestException('Add a banner image');
    const urls = await this.cloudinary.uploadMany([desktop, ...(files.imageMobile ?? [])], AD_FOLDER);
    try {
      return await this.prisma.ad.create({
        data: {
          advertiser: dto.advertiser,
          headline: dto.headline ?? '',
          linkUrl: dto.linkUrl,
          placement: dto.placement,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          paused: dto.paused ?? false,
          imageDesktop: urls[0],
          imageMobile: urls[1] ?? null,
        },
      });
    } catch (e) {
      await this.cloudinary.deleteMany(urls);
      throw e;
    }
  }

  @Patch(':id')
  @UseInterceptors(AdImagesInterceptor())
  async update(@Param('id') id: string, @Body() dto: UpdateAdDto, @UploadedFiles() files: AdImageFiles = {}) {
    const ad = await this.find(id);
    const desktop = files.imageDesktop?.[0];
    const mobile = files.imageMobile?.[0];
    if (!hasAnyField(dto) && !desktop && !mobile) throw new BadRequestException('Nothing to update');
    checkDates(dto.startsAt ?? ad.startsAt, dto.endsAt ?? ad.endsAt);

    const [newDesktop, newMobile] = await Promise.all([
      desktop ? this.cloudinary.upload(desktop, AD_FOLDER) : undefined,
      mobile ? this.cloudinary.upload(mobile, AD_FOLDER) : undefined,
    ]);
    const { removeMobileImage, ...fields } = dto;
    const imageMobile = newMobile ?? (removeMobileImage ? null : undefined);
    const updated = await this.prisma.ad.update({
      where: { id },
      data: { ...fields, ...(newDesktop && { imageDesktop: newDesktop }), ...(imageMobile !== undefined && { imageMobile }) },
    });
    // Old images are only removed once the new ones are saved
    const old = [newDesktop && ad.imageDesktop, imageMobile !== undefined && ad.imageMobile].filter(
      (u): u is string => typeof u === 'string' && u.length > 0,
    );
    await this.cloudinary.deleteMany(old);
    return updated;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const ad = await this.find(id);
    await this.prisma.ad.delete({ where: { id } });
    await this.cloudinary.deleteMany([ad.imageDesktop, ad.imageMobile].filter((u): u is string => !!u));
    return { id, deleted: true };
  }

  private async find(id: string) {
    const ad = await this.prisma.ad.findUnique({ where: { id } });
    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }
}

/** Site-wide switches (currently: Google AdSense on/off). */
@Controller('admin/settings')
@UseGuards(AdminGuard)
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const s = await this.prisma.siteSetting.findUnique({ where: { id: 1 } });
    return { adsenseEnabled: s?.adsenseEnabled ?? false };
  }

  @Patch()
  async update(@Body() dto: UpdateSettingsDto) {
    const s = await this.prisma.siteSetting.upsert({
      where: { id: 1 },
      update: { adsenseEnabled: dto.adsenseEnabled },
      create: { id: 1, adsenseEnabled: dto.adsenseEnabled },
    });
    return { adsenseEnabled: s.adsenseEnabled };
  }
}

function checkDates(start: Date, end: Date) {
  if (end.getTime() <= start.getTime()) throw new BadRequestException('End date must be after the start date');
}
