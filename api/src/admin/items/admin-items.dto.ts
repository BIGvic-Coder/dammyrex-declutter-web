import { ItemCondition, ItemStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX, normalizeNgPhone } from '../../common/phone';
import { ToBoolean, ToNaira, Trim } from '../../common/transforms';

export class AdminListItemsQuery {
  @IsOptional() @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional() @Trim() @IsString() @MaxLength(100)
  q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}

/** Edit item details (review queue: edit price, feature; or general corrections). */
export class AdminUpdateItemDto {
  @IsOptional() @Trim() @IsString() @Length(3, 100)
  title?: string;

  @IsOptional() @Trim() @IsString() @Length(10, 2000)
  description?: string;

  @IsOptional() @Trim() @IsString() @Length(1, 40)
  categoryId?: string;

  @IsOptional() @ToNaira() @IsInt() @Min(500) @Max(50_000_000)
  price?: number;

  @IsOptional() @IsEnum(ItemCondition)
  condition?: ItemCondition;

  @IsOptional() @Trim() @IsString() @Length(2, 80)
  area?: string;

  @IsOptional() @Trim() @IsString() @Length(5, 300)
  addressPrivate?: string;

  @IsOptional() @IsBoolean()
  featured?: boolean;
}

export class AdminUpdateStatusDto {
  @IsEnum(ItemStatus)
  status: ItemStatus;
}

/** Statuses the CEO can create an item with: live straight away, or saved for later. */
export const CREATE_STATUSES = ['AVAILABLE', 'PENDING'] as const;

/**
 * Multipart fields for POST /admin/items (photos come separately as "images").
 * Seller details are optional: leave them out for DammyRex's own stock.
 */
export class AdminCreateItemDto {
  @Trim() @IsString() @Length(3, 100)
  title: string;

  @Trim() @IsString() @Length(10, 2000)
  description: string;

  @Trim() @IsString() @Length(1, 40)
  categoryId: string;

  @ToNaira() @IsInt({ message: 'Price must be a whole number of naira' }) @Min(500) @Max(50_000_000)
  price: number;

  @IsEnum(ItemCondition)
  condition: ItemCondition;

  /** Public area, e.g. "Ikeja, Lagos" */
  @Trim() @IsString() @Length(2, 80)
  area: string;

  /** Pickup/inspection address. Admin only. */
  @Trim() @IsString() @Length(5, 300)
  addressPrivate: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  featured?: boolean;

  @IsOptional() @IsIn(CREATE_STATUSES)
  status?: (typeof CREATE_STATUSES)[number];

  @IsOptional() @Trim() @IsString() @Length(2, 80)
  sellerName?: string;

  // Empty string from the form means "no seller"
  @Transform(({ value }) => (typeof value === 'string' && value.trim() === '' ? undefined : normalizeNgPhone(value)))
  @ValidateIf((o) => o.sellerPhone !== undefined)
  @IsString()
  @Matches(NG_PHONE_REGEX, { message: NG_PHONE_MESSAGE })
  sellerPhone?: string;
}
