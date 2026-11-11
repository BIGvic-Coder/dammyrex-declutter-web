import { Transform, Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';
import { NG_PHONE_MESSAGE, NG_PHONE_REGEX, normalizeNgPhone } from '../../common/phone';
import { Trim } from '../../common/transforms';

export class CreateInspectionDto {
  @Trim() @IsString() @Length(1, 40)
  itemId: string;

  @Trim() @IsString() @Length(2, 80)
  buyerName: string;

  @Transform(({ value }) => normalizeNgPhone(value))
  @IsString()
  @Matches(NG_PHONE_REGEX, { message: NG_PHONE_MESSAGE })
  buyerPhone: string;

  /** ISO date-time, e.g. 2026-11-12T14:00:00+01:00 */
  @Type(() => Date)
  @IsDate({ message: 'Choose a valid date and time' })
  slotAt: Date;

  @IsOptional() @Trim() @IsString() @MaxLength(500)
  note?: string;
}
