import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: 'OWNER' | 'STAFF';
}

export type AdminRequest = Request & { admin: AdminJwtPayload };

/** Requires "Authorization: Bearer <token>" issued by POST /admin/login. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Please log in');
    }
    try {
      req.admin = await this.jwt.verifyAsync<AdminJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Session expired, please log in again');
    }
    return true;
  }
}
