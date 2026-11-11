import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limit by the real visitor IP.
 *
 * On Render, traffic goes Cloudflare -> Render proxy -> app, so `req.ip` (with trust proxy = 1)
 * is a Cloudflare edge address that changes between requests, which splits one visitor's
 * requests across many counters. Cloudflare always overwrites `CF-Connecting-IP` with the real
 * client IP, so it can't be spoofed there. We only trust it when running behind Render's
 * Cloudflare edge (Render sets RENDER=true), or when TRUST_CF_CONNECTING_IP=true is set.
 * Locally the header is ignored, because anyone could send it.
 */
const TRUST_CF = process.env.RENDER === 'true' || process.env.TRUST_CF_CONNECTING_IP === 'true';

@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (TRUST_CF) {
      const cf = req.headers?.['cf-connecting-ip'];
      const ip = Array.isArray(cf) ? cf[0] : cf;
      if (typeof ip === 'string' && ip.trim()) return ip.trim();
    }
    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
