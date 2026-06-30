import { NextResponse } from 'next/server';
import { verifyBalanceToken } from '@/lib/booking-token';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';

  const payload = verifyBalanceToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }
  return NextResponse.json(payload);
}
