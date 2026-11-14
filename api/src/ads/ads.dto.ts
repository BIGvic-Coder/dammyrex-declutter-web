import { AdPlacement } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';
import { ToBoolean, Trim } from '../common/transforms';

const URL_RULES = { protocols: ['http', 'https'], require_protocol: true };
const URL_MESSAGE = 'Link must be a full web address starting with https:// (or a WhatsApp link)';

/** Multipart fields for POST /admin/ads (images come as files "imageDesktop" / "imageMobile"). */
export class CreateAdDto {
  @Trim() @IsString() @Length(2, 80)
  advertiser: string;

  @IsOptional() @Trim() @IsString() @MaxLength(120)
  headline?: string;

  @Trim() @IsUrl(URL_RULES, { message: URL_MESSAGE }) @MaxLength(500)
  linkUrl: string;

  @IsEnum(AdPlacement)
  placement: AdPlacement;

  /** ISO date-time, e.g. 2026-12-01T00:00:00+01:00 */
  @Type(() => Date) @IsDate({ message: 'Choose a valid start date' })
  startsAt: Date;

  @Type(() => Date) @IsDate({ message: 'Choose a valid end date' })
  endsAt: Date;

  @IsOptional() @ToBoolean() @IsBoolean()
  paused?: boolean;
}

/** Every field optional; new image files replace the old ones. */
export class UpdateAdDto {
  @IsOptional() @Trim() @IsString() @Length(2, 80)
  advertiser?: string;

  @IsOptional() @Trim() @IsString() @MaxLength(120)
  headline?: string;

  @IsOptional() @Trim() @IsUrl(URL_RULES, { message: URL_MESSAGE }) @MaxLength(500)
  linkUrl?: string;

  @IsOptional() @IsEnum(AdPlacement)
  placement?: AdPlacement;

  @IsOptional() @Type(() => Date) @IsDate({ message: 'Choose a valid start date' })
  startsAt?: Date;

  @IsOptional() @Type(() => Date) @IsDate({ message: 'Choose a valid end date' })
  endsAt?: Date;

  @IsOptional() @ToBoolean() @IsBoolean()
  paused?: boolean;

  /** "true" removes the phone-size image (the desktop one is then used everywhere) */
  @IsOptional() @ToBoolean() @IsBoolean()
  removeMobileImage?: boolean;
}

export class UpdateSettingsDto {
  @IsBoolean()
  adsenseEnabled: boolean;
}
