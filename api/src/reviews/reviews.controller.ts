import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  /** Approved testimonials only. */
  @Get()
  list() {
    return this.prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, name: true, text: true, rating: true, createdAt: true },
    });
  }
}
