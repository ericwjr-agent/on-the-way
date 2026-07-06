/**
 * Server-only module — HMAC-signed balance payment tokens.
 * No database required: the token IS the booking data.
 */
import crypto from 'crypto';

export interface BalanceLinkPayload {
  customerName:    string;
  customerEmail:   string;
  customerPhone:   string;
  address:         string;
  remainingCents:  number;
  totalCents:      number;
  depositCents:    number;
  authorizationId: string; // PayPal auth ID — capture remaining balance without a second checkout
  exp:             number; // Unix ms expiry
  isAdmin?:        boolean; // true = driver/admin token (longer-lived)
}

const SECRET = process.env.BOOKING_SECRET ?? 'dev-secret-change-in-prod';

/** 72-hour customer token */
export function createBalanceToken(payload: BalanceLinkPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig  = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/** 25-day admin token — same structure, longer expiry, isAdmin: true */
export function createAdminToken(payload: Omit<BalanceLinkPayload, 'exp' | 'isAdmin'>): string {
  return createBalanceToken({
    ...payload,
    isAdmin: true,
    exp: Date.now() + 25 * 24 * 60 * 60 * 1000,
  });
}

export function verifyBalanceToken(token: string): BalanceLinkPayload | null {
  try {
    const dot  = token.lastIndexOf('.');
    if (dot < 0) return null;
    const data = token.slice(0, dot);
    const sig  = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    const payload: BalanceLinkPayload = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf-8'),
    );
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
