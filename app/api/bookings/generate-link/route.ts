import { NextResponse } from 'next/server';
import { createBalanceToken } from '@/lib/booking-token';

export async function POST(request: Request) {
  try {
    const {
      customerName, customerEmail, customerPhone,
      address, remainingCents, totalCents, depositCents,
    } = await request.json();

    const token = createBalanceToken({
      customerName,
      customerEmail,
      customerPhone,
      address,
      remainingCents,
      totalCents,
      depositCents,
      exp: Date.now() + 72 * 60 * 60 * 1000, // 72 hours
    });

    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://on-the-way-seven.vercel.app';
    const link = `${base}/confirm-delivery?token=${token}`;

    return NextResponse.json({ link });
  } catch (err) {
    console.error('generate-link error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
