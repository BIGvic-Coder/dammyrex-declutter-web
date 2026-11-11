import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

const FOLDER = 'dammyrex/items';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly configured: boolean;

  constructor(config: ConfigService) {
    const cloud_name = config.get<string>('CLOUDINARY_CLOUD_NAME');
    const api_key = config.get<string>('CLOUDINARY_API_KEY');
    const api_secret = config.get<string>('CLOUDINARY_API_SECRET');
    this.configured = Boolean(
      cloud_name && api_key && api_secret && cloud_name !== 'your-cloud-name',
    );
    if (this.configured) {
      cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    } else {
      this.logger.warn('Cloudinary is not configured; image uploads will fail until keys are set');
    }
  }

  /**
   * Uploads one image. The stored original is capped at 1600px and re-compressed
   * so phone photos (often 4-8 MB) don't bloat storage; delivery-time resizing
   * happens on the web side via Cloudinary URL transforms.
   */
  upload(file: Express.Multer.File): Promise<string> {
    if (!this.configured) {
      throw new ServiceUnavailableException('Image uploads are not available right now');
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: FOLDER,
          resource_type: 'image',
          transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
        },
        (err, res?: UploadApiResponse) => {
          if (err || !res) {
            this.logger.error(`Cloudinary upload failed: ${err?.message ?? 'no response'}`);
            return reject(new ServiceUnavailableException('Could not upload image, please try again'));
          }
          resolve(res.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  /** Best-effort delete by URL (used when an upload batch fails or an item is deleted). */
  async deleteByUrl(url: string): Promise<void> {
    if (!this.configured) return;
    const publicId = CloudinaryService.publicIdFromUrl(url);
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      this.logger.warn(`Failed to delete Cloudinary image ${publicId}: ${(e as Error).message}`);
    }
  }

  /** https://res.cloudinary.com/<cloud>/image/upload/v123/dammyrex/items/abc.jpg -> dammyrex/items/abc */
  static publicIdFromUrl(url: string): string | null {
    const m = url.match(/\/image\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?(dammyrex\/.+?)\.[a-z0-9]+$/i);
    return m ? m[1] : null;
  }
}
