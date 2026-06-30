/**
 * POST /api/bookings/charge-balance
 *
 * Verifies the signed balance token, then does a final capture against
 * the existing PayPal authorization — no second checkout required.
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
        { error: 'This payment link is invalid or has expired.' },
        { status: 400 },
      );
    }

    const accessToken     = await getAccessToken();
    const remainingAmount = (booking.remainingCents / 100).toFixed(2);

    // Final capture against the existing authorization
    const res = await fetch(
      `${PAYPAL_API}/v2/payments/authorizations/${booking.authorizationId}/capture`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount:        { currency_code: 'USD', value: remainingAmount },
          final_capture: true,
        }),
      },
    );

    const data = await res.json();

    if (data.status !== 'COMPLETED') {
      console.error('Balance capture failed:', data);
      return NextResponse.json({ error: 'Payment capture failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('charge-balance error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
