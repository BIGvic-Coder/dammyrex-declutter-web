import { Body, Controller, HttpCode, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { ClientIpThrottlerGuard } from '../../common/client-ip-throttler.guard';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminJwtPayload } from './admin.guard';

class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @IsString() @Length(1, 200)
  password: string;
}

// Compared against when the email doesn't exist, so response time doesn't reveal valid emails.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ClientIpThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 1000 } }) // 5 attempts per minute per IP
  async login(@Body() dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    const valid = await bcrypt.compare(dto.password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !valid) throw new UnauthorizedException('Wrong email or password');

    const payload: AdminJwtPayload = { sub: admin.id, email: admin.email, role: admin.role };
    return {
      token: await this.jwt.signAsync(payload),
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
    };
  }
}
