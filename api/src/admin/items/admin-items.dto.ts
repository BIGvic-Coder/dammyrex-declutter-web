import { ItemCondition, ItemStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transforms';

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

  @IsOptional()
  @Transform(({ obj }) => {
    const raw = obj.price;
    if (typeof raw !== 'string') return raw;
    const cleaned = raw.replace(/[,\s₦]/g, '');
    return cleaned === '' ? NaN : Number(cleaned);
  })
  @IsInt() @Min(500) @Max(50_000_000)
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
