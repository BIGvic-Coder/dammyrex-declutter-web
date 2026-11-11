import { ItemCondition } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX, normalizeNgPhone } from '../../common/phone';
import { Trim } from '../../common/transforms';

/** Multipart form fields for POST /items/submit (images come separately as "images"). */
export class SubmitItemDto {
  @Trim() @IsString() @Length(3, 100)
  title: string;

  @Trim() @IsString() @Length(10, 2000)
  description: string;

  @Trim() @IsString() @Length(1, 40)
  categoryId: string;

  /** Asking price in naira (whole number) */
  // Accepts "45000", "45,000", "₦45,000" (multipart fields arrive as strings)
  @Transform(({ obj }) => {
    const raw = obj.price;
    if (typeof raw !== 'string') return raw;
    const cleaned = raw.replace(/[,\s₦]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
  })
  @IsInt({ message: 'Price must be a whole number of naira' })
  @Min(500)
  @Max(50_000_000)
  price: number;

  @IsEnum(ItemCondition)
  condition: ItemCondition;

  /** Public area, e.g. "Ikeja, Lagos" */
  @Trim() @IsString() @Length(2, 80)
  area: string;

  /** Full pickup address. Admin only, never shown publicly. */
  @Trim() @IsString() @Length(5, 300)
  addressPrivate: string;

  @Trim() @IsString() @Length(2, 80)
  sellerName: string;

  @Transform(({ value }) => normalizeNgPhone(value))
  @IsString()
  @Matches(NG_PHONE_REGEX, { message: NG_PHONE_MESSAGE })
  sellerPhone: string;
}
