import { NextResponse }        from 'next/server';
import { createBalanceToken }  from '@/lib/booking-token';
import { sendBookingEmails }   from '@/lib/email';
import type { BookingEmailData } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName, customerEmail, customerPhone,
      address, etaMinutes, distanceMiles,
      totalCents, depositCents, remainingCents, isRushHour,
      authorizationId,
    } = body;

    // Build the 72-hour balance payment link
    const token = createBalanceToken({
      customerName,
      customerEmail,
      customerPhone,
      address,
      remainingCents,
      totalCents,
      depositCents,
      authorizationId,
      exp: Date.now() + 72 * 60 * 60 * 1000,
    });

    const base       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://on-the-way-seven.vercel.app';
    const balanceLink = `${base}/confirm-delivery?token=${token}`;

    const bookingTime = new Date().toLocaleString('en-US', {
      timeZone:  'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const emailData: BookingEmailData = {
      customerName,
      customerEmail,
      customerPhone,
      address,
      etaMinutes,
      distanceMiles,
      totalCents,
      depositCents,
      remainingCents,
      isRushHour,
      bookingTime,
      balanceLink,
    };

    await sendBookingEmails(emailData);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
