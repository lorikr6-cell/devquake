import 'server-only';
import { headers } from 'next/headers';

export interface RequestInfo {
  ip: string | null;
  userAgent: string | null;
}

/** Client IP and user agent of the current request (behind Hostinger's proxy). */
export async function getRequestInfo(): Promise<RequestInfo> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || h.get('x-real-ip') || null;
  return {
    ip: ip ? ip.slice(0, 45) : null,
    userAgent: h.get('user-agent')?.slice(0, 512) ?? null,
  };
}
