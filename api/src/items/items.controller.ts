import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ListItemsQuery } from './dto/list-items.query';
import { SubmitItemDto } from './dto/submit-item.dto';
import { ItemsService, MAX_IMAGES } from './items.service';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const ALLOWED_MIME = /^image\/(jpeg|png|webp|heic|heif)$/;

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
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } }) // 5 submissions per hour per IP
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES, {
      // No storage/dest set → multer keeps files in memory (file.buffer) for streaming to Cloudinary
      limits: { fileSize: MAX_FILE_BYTES, files: MAX_IMAGES, fields: 20 },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.test(file.mimetype)) {
          return cb(new BadRequestException('Photos must be JPG, PNG, WebP or HEIC'), false);
        }
        cb(null, true);
      },
    }),
  )
  submit(@Body() dto: SubmitItemDto, @UploadedFiles() files: Express.Multer.File[]) {
    return this.items.submit(dto, files);
  }
}
