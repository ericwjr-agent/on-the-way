import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { address, distanceMiles } = await request.json();

    const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      return NextResponse.json({ ok: false, error: 'EmailJS not configured' });
    }

    const now = new Date().toLocaleString('en-US', {
      timeZone:  'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  serviceId,
        template_id: templateId,
        user_id:     publicKey,
        template_params: {
          booking_time:     now,
          customer_name:    'Out-of-Range Alert',
          customer_phone:   'N/A',
          customer_email:   'N/A',
          customer_address: address,
          distance_miles:   distanceMiles.toFixed(1),
          eta_minutes:      'N/A',
          total_price:      'OUT OF RANGE',
          deposit_paid:     '$0.00',
          balance_due:      '$0.00',
          rush_hour:        'N/A',
        },
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Out-of-range notification error:', err);
    return NextResponse.json({ ok: false });
  }
}
