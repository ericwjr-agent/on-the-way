import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Maps API not configured' }, { status: 500 });
  }

  // Find nearest Tesla Supercharger via Places Nearby Search
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
    `?location=${lat},${lng}&rankby=distance&keyword=Tesla+Supercharger&key=${apiKey}`;

  const res  = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return NextResponse.json({ error: 'No Supercharger found nearby' }, { status: 404 });
  }

  const nearest = data.results[0];
  return NextResponse.json({
    name: nearest.name,
    vicinity: nearest.vicinity,
    lat: nearest.geometry.location.lat,
    lng: nearest.geometry.location.lng,
  });
}
