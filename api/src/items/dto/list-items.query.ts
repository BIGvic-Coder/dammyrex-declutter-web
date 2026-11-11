import { ItemCondition } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ToBoolean, Trim } from '../../common/transforms';

export class ListItemsQuery {
  /** Category slug, e.g. "fridges" */
  @IsOptional() @Trim() @IsString() @MaxLength(60)
  category?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  minPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  maxPrice?: number;

  @IsOptional() @Trim() @IsString() @MaxLength(80)
  area?: string;

  @IsOptional() @IsEnum(ItemCondition)
  condition?: ItemCondition;

  /** Free-text search over title and description */
  @IsOptional() @Trim() @IsString() @MaxLength(100)
  q?: string;

  @IsOptional() @ToBoolean() @IsBoolean()
  featured?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48)
  limit?: number;
}
