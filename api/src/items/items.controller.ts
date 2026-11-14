import { Body, Controller, Get, Param, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClientIpThrottlerGuard } from '../common/client-ip-throttler.guard';
import { ImagesInterceptor } from '../common/image-upload';
import { ListItemsQuery } from './dto/list-items.query';
import { SubmitItemDto } from './dto/submit-item.dto';
import { ItemsService } from './items.service';

@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get()
  list(@Query() query: ListItemsQuery) {
    return this.items.list(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.items.findPublic(id);
  }

  @Post('submit')
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } }) // 5 submissions per hour per IP
  @UseInterceptors(ImagesInterceptor())
  submit(@Body() dto: SubmitItemDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.items.submit(dto, files);
  }
}
