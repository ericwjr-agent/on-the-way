import { NextRequest, NextResponse } from 'next/server';

const PAYPAL_MODE   = process.env.PAYPAL_MODE ?? 'sandbox';
const PAYPAL_BASE   = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;
  const secret   = process.env.PAYPAL_CLIENT_SECRET!;
  const creds    = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { depositCents, description } = await req.json();

    if (!depositCents || depositCents < 100) {
      return NextResponse.json({ error: 'Invalid deposit amount' }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const amount      = (depositCents / 100).toFixed(2);

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount:      { currency_code: 'USD', value: amount },
          description: description ?? 'On the Way — Emergency Charge Deposit',
        }],
        application_context: {
          brand_name:    'On the Way',
          user_action:   'PAY_NOW',
          return_url:    `${process.env.NEXT_PUBLIC_APP_URL}/confirmation`,
          cancel_url:    `${process.env.NEXT_PUBLIC_APP_URL}/book`,
        },
      }),
    });

    const order = await res.json();
    if (!order.id) throw new Error('PayPal order creation failed');

    return NextResponse.json({ id: order.id });
  } catch (err: any) {
    console.error('/api/create-order error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
