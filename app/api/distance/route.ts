import { NextRequest, NextResponse } from 'next/server';
import { calculatePriceCents, checkRushHour, depositCents, priceBreakdown, BUFFER_MINUTES } from '@/lib/pricing';

// Service origin (kept server-side, never exposed to client)
const ORIGIN = '1199 Huff Rd NW, Atlanta, GA 30318';

export async function POST(req: NextRequest) {
  try {
    const { address, lat, lng } = await req.json();

    if (!address && (!lat || !lng)) {
      return NextResponse.json({ error: 'Address or coordinates required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Maps API not configured' }, { status: 500 });
    }

    const destination = encodeURIComponent(address || `${lat},${lng}`);
    const origin      = encodeURIComponent(ORIGIN);

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json`
      + `?origins=${origin}&destinations=${destination}&units=imperial&key=${apiKey}`;

    const res  = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      return NextResponse.json({ error: 'Could not calculate distance' }, { status: 400 });
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      return NextResponse.json({ error: 'Location not reachable' }, { status: 400 });
    }

    // Distance in miles, duration in minutes
    const distanceMiles  = element.distance.value * 0.000621371;
    const drivingMinutes = Math.ceil(element.duration.value / 60);
    const etaMinutes     = drivingMinutes + BUFFER_MINUTES;

    const now       = new Date();
    const rush      = checkRushHour(now);
    const breakdown = priceBreakdown(distanceMiles, now);

    return NextResponse.json({
      distanceMiles:   Math.round(distanceMiles * 10) / 10,
      drivingMinutes,
      etaMinutes,
      priceCents:      breakdown.total,
      depositCents:    breakdown.deposit,
      remainingCents:  breakdown.remaining,
      isRushHour:      rush,
      breakdown: {
        base:    breakdown.base,
        extra:   breakdown.extra,
        rushFee: breakdown.rushFee,
      },
    });
  } catch (err) {
    console.error('/api/distance error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
