/**
 * POST /api/bookings/void-authorization
 *
 * Verifies the signed token (customer or admin), then voids the
 * PayPal authorization — releasing the hold with no charge.
 */
import { NextResponse }       from 'next/server';
import { verifyBalanceToken } from '@/lib/booking-token';

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
      ).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    const booking = verifyBalanceToken(token);
    if (!booking) {
      return NextResponse.json(
        { error: 'This link is invalid or has expired.' },
        { status: 400 },
      );
    }

    const accessToken = await getAccessToken();

    // Void the authorization — releases the hold immediately, no charge
    const res = await fetch(
      `${PAYPAL_API}/v2/payments/authorizations/${booking.authorizationId}/void`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      },
    );

    // PayPal returns 204 No Content on success
    if (res.status !== 204 && res.status !== 200) {
      const body = await res.text();
      console.error('PayPal void failed:', res.status, body);
      return NextResponse.json({ error: 'Failed to void authorization' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('void-authorization error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
