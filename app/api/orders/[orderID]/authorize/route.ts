/**
 * POST /api/orders/[orderID]/authorize
 *
 * 1. Authorizes the full-amount PayPal order (customer already approved it).
 * 2. Immediately does a partial capture for the deposit (10%).
 * 3. Returns { authorizationId } so the balance can be captured later
 *    without any additional PayPal checkout.
 */
import { NextResponse } from 'next/server';

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

export async function POST(
  request: Request,
  { params }: { params: { orderID: string } },
) {
  try {
    const { depositCents } = await request.json();
    const accessToken = await getAccessToken();

    // Step 1 — authorize the order
    const authRes = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${params.orderID}/authorize`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      },
    );
    const authData = await authRes.json();

    const authorizationId =
      authData?.purchase_units?.[0]?.payments?.authorizations?.[0]?.id;

    if (!authorizationId) {
      console.error('PayPal authorize failed:', authData);
      return NextResponse.json({ error: 'Authorization failed' }, { status: 500 });
    }

    // Step 2 — partial capture: deposit only (final_capture: false)
    const depositAmount = (depositCents / 100).toFixed(2);
    const captureRes = await fetch(
      `${PAYPAL_API}/v2/payments/authorizations/${authorizationId}/capture`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount:        { currency_code: 'USD', value: depositAmount },
          final_capture: false,
        }),
      },
    );
    const captureData = await captureRes.json();

    if (captureData.status !== 'COMPLETED') {
      console.error('Deposit capture failed:', captureData);
      return NextResponse.json({ error: 'Deposit capture failed' }, { status: 500 });
    }

    return NextResponse.json({ authorizationId });
  } catch (err) {
    console.error('authorize route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
