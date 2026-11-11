import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { publicVisibleWhere } from '../common/public-item';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';

const MIN_LEAD_MS = 60 * 60 * 1000; // at least 1 hour from now
const MAX_AHEAD_MS = 30 * 24 * 60 * 60 * 1000; // within 30 days

@Injectable()
export class InspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInspectionDto) {
    const now = Date.now();
    const slot = dto.slotAt.getTime();
    if (slot < now + MIN_LEAD_MS) {
      throw new BadRequestException('Choose a time at least 1 hour from now');
    }
    if (slot > now + MAX_AHEAD_MS) {
      throw new BadRequestException('Choose a time within the next 30 days');
    }

    const item = await this.prisma.item.findFirst({
      where: { AND: [{ id: dto.itemId }, publicVisibleWhere()] },
      select: { id: true, status: true },
    });
    if (!item) throw new NotFoundException('Item not found');
    if (item.status === 'SOLD') {
      throw new BadRequestException('Sorry, this item has already been sold');
    }

    const existing = await this.prisma.inspection.findFirst({
      where: {
        itemId: item.id,
        buyerPhone: dto.buyerPhone,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'You already have an inspection request for this item. We will contact you on WhatsApp.',
      );
    }

    const inspection = await this.prisma.inspection.create({
      data: {
        itemId: item.id,
        buyerName: dto.buyerName,
        buyerPhone: dto.buyerPhone,
        slotAt: dto.slotAt,
        note: dto.note || null,
      },
      select: { id: true, status: true, slotAt: true },
    });

    return {
      ...inspection,
      message: 'Inspection requested! We will confirm the time with you on WhatsApp.',
    };
  }
}
