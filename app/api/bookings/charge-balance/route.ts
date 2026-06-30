import { NextResponse } from 'next/server';
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
        { error: 'This payment link is invalid or has expired. Please contact support.' },
        { status: 400 },
      );
    }

    const accessToken = await getAccessToken();
    const amount      = (booking.remainingCents / 100).toFixed(2);

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount },
          description: `Cyber Juice — Remaining Balance (${booking.customerName})`,
        }],
        application_context: {
          brand_name:          'Cyber Juice',
          user_action:         'PAY_NOW',
          shipping_preference: 'NO_SHIPPING',
        },
      }),
    });

    const order = await res.json();
    if (!order.id) {
      console.error('PayPal order creation failed:', order);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    return NextResponse.json({ id: order.id });
  } catch (err) {
    console.error('charge-balance error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
