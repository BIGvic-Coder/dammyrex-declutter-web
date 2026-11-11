import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InspectionStatus, Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { hasAnyField, TX_OPTIONS } from '../../common/transaction';
import { Trim } from '../../common/transforms';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminGuard } from '../auth/admin.guard';

class AdminListInspectionsQuery {
  @IsOptional() @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}

class AdminUpdateInspectionDto {
  @IsOptional() @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  /** Reschedule */
  @IsOptional() @Type(() => Date) @IsDate()
  slotAt?: Date;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  note?: string;
}

/** Allowed status changes. DONE and CANCELLED are final. */
const TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

const inspectionInclude = {
  item: {
    select: {
      id: true,
      title: true,
      price: true,
      status: true,
      area: true,
      addressPrivate: true,
      images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      seller: { select: { name: true, phone: true } },
    },
  },
} satisfies Prisma.InspectionInclude;

@Controller('admin/inspections')
@UseGuards(AdminGuard)
export class AdminInspectionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() query: AdminListInspectionsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const where: Prisma.InspectionWhereInput = query.status ? { status: query.status } : {};
    const open = !query.status || query.status === 'REQUESTED' || query.status === 'CONFIRMED';
    const [total, inspections] = await this.prisma.$transaction([
      this.prisma.inspection.count({ where }),
      this.prisma.inspection.findMany({
        where,
        include: inspectionInclude,
        // Open requests: soonest first. History: most recent first.
        orderBy: open ? { slotAt: 'asc' } : { slotAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { inspections, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  /**
   * CONFIRMED → item becomes RESERVED.
   * CANCELLED → item returns to AVAILABLE, unless another confirmed inspection still holds it
   *             or the item has since been sold/removed.
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: AdminUpdateInspectionDto) {
    if (!hasAnyField(dto)) throw new BadRequestException('Nothing to update');

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.inspection.findUnique({
        where: { id },
        include: { item: { select: { id: true, status: true } } },
      });
      if (!current) throw new NotFoundException('Inspection not found');

      const changingStatus = dto.status && dto.status !== current.status;
      if (changingStatus && !TRANSITIONS[current.status].includes(dto.status!)) {
        throw new BadRequestException(`Cannot change an inspection from ${current.status} to ${dto.status}`);
      }

      if (changingStatus && dto.status === 'CONFIRMED') {
        if (current.item.status !== 'AVAILABLE' && current.item.status !== 'RESERVED') {
          throw new BadRequestException(`Item is ${current.item.status}; it cannot be reserved`);
        }
        await tx.item.update({ where: { id: current.item.id }, data: { status: 'RESERVED' } });
      }

      if (changingStatus && dto.status === 'CANCELLED' && current.item.status === 'RESERVED') {
        const otherConfirmed = await tx.inspection.count({
          where: { itemId: current.item.id, status: 'CONFIRMED', id: { not: id } },
        });
        if (otherConfirmed === 0) {
          await tx.item.update({ where: { id: current.item.id }, data: { status: 'AVAILABLE' } });
        }
      }

      return tx.inspection.update({
        where: { id },
        data: {
          ...(dto.status && { status: dto.status }),
          ...(dto.slotAt && { slotAt: dto.slotAt }),
          ...(dto.note !== undefined && { note: dto.note || null }),
        },
        include: inspectionInclude,
      });
    }, TX_OPTIONS);
  }
}
