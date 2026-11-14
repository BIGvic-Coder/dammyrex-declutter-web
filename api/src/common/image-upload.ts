import { BadRequestException } from '@nestjs/common';
import { FileFieldsInterceptor, FilesInterceptor } from '@nestjs/platform-express';

/** Max photos per item (enforced on every upload route). */
export const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB per photo
const ALLOWED_MIME = /^image\/(jpeg|png|webp|heic|heif)$/;

const imageOnly = (_req: unknown, file: Express.Multer.File, cb: (e: Error | null, ok: boolean) => void) => {
  if (!ALLOWED_MIME.test(file.mimetype)) {
    return cb(new BadRequestException('Photos must be JPG, PNG, WebP or HEIC'), false);
  }
  cb(null, true);
};

/**
 * Multipart "images" field, kept in memory (file.buffer) for streaming to Cloudinary.
 * Shared by the public submit form and the admin item routes so the rules can't drift.
 */
export const ImagesInterceptor =(maxCount = MAX_IMAGES) =>
  FilesInterceptor('images', maxCount, {
    limits: { fileSize: MAX_FILE_BYTES, files: maxCount, fields: 20 },
    fileFilter: imageOnly,
  });

/** Ad banners: one "imageDesktop" and an optional "imageMobile" file. */
export const AdImagesInterceptor = () =>
  FileFieldsInterceptor(
    [
      { name: 'imageDesktop', maxCount: 1 },
      { name: 'imageMobile', maxCount: 1 },
    ],
    { limits: { fileSize: MAX_FILE_BYTES, files: 2, fields: 20 }, fileFilter: imageOnly },
  );

export type AdImageFiles = { imageDesktop?: Express.Multer.File[]; imageMobile?: Express.Multer.File[] };
