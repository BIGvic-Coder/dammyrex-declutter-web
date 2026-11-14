import { BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

/** Max photos per item (enforced on every upload route). */
export const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const ALLOWED_MIME = /^image\/(jpeg|png|webp|heic|heif)$/;

/**
 * Multipart "images" field, kept in memory (file.buffer) for streaming to Cloudinary.
 * Shared by the public submit form and the admin item routes so the rules can't drift.
 */
export const ImagesInterceptor = (maxCount = MAX_IMAGES) =>
  FilesInterceptor('images', maxCount, {
    limits: { fileSize: MAX_FILE_BYTES, files: maxCount, fields: 20 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME.test(file.mimetype)) {
        return cb(new BadRequestException('Photos must be JPG, PNG, WebP or HEIC'), false);
      }
      cb(null, true);
    },
  });
