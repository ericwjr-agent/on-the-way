import { NextResponse } from 'next/server';

const PAYPAL_API = process.env.PAYPAL_ENV === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const clientId     = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

export async function POST(
  _request: Request,
  { params }: { params: { orderID: string } }
) {
  try {
    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${params.orderID}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (data.status !== 'COMPLETED') {
      console.error('PayPal capture failed:', data);
      return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('PayPal capture error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
