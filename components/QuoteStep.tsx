'use client';

import { useState, useEffect } from 'react';
import { priceBreakdown, formatUSD, BUFFER_MINUTES, MAX_SUPERCHARGER_MILES, TIER1_MAX_MILES, TIER2_MAX_MILES } from '@/lib/pricing';
import type { LocationData, QuoteData } from '@/lib/types';

// Origin kept as a constant — not displayed in the UI
const ORIGIN_ADDRESS = '1199 Huff Rd NW, Atlanta, GA 30318';

interface Props {
  location: LocationData;
  onNext:   (quote: QuoteData) => void;
  onBack:   () => void;
}

export default function QuoteStep({ location, onNext, onBack }: Props) {
  const [quote,   setQuote]   = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.google) {
      // Maps not ready yet — wait for it
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          calculate();
        }
      }, 200);
      return () => clearInterval(interval);
    }
    calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  async function calculate() {
    setLoading(true);
    setError('');

    const customerLatLng = location.lat && location.lng
      ? new window.google.maps.LatLng(location.lat, location.lng)
      : location.address;

    // 1 — Find nearest Supercharger using client-side Places API
    const customerLatLngForSearch = location.lat && location.lng
      ? new window.google.maps.LatLng(location.lat, location.lng)
      : new window.google.maps.LatLng(33.7490, -84.3880); // fallback: Atlanta

    let superchargerLatLng: google.maps.LatLng | null = null;
    let superchargerName = '';

    await new Promise<void>((resolve) => {
      const placesDiv = document.createElement('div');
      const placesService = new window.google.maps.places.PlacesService(placesDiv);
      placesService.nearbySearch(
        {
          location: customerLatLngForSearch,
          rankBy:   window.google.maps.places.RankBy.DISTANCE,
          keyword:  'Tesla Supercharger',
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results?.length) {
            const sc = results[0];
            superchargerLatLng = sc.geometry?.location ?? null;
            superchargerName   = sc.vicinity ?? sc.name ?? 'Supercharger';
          }
          resolve();
        }
      );
    });

    if (!superchargerLatLng) {
      setError('Could not locate a nearby Tesla Supercharger. We may not be able to service this area.');
      setLoading(false);
      return;
    }

    // 2 — Distance Matrix: driver→customer AND customer→supercharger in one call
    const service = new window.google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins:      [ORIGIN_ADDRESS, customerLatLng],
        destinations: [customerLatLng, superchargerLatLng],
        travelMode:   window.google.maps.TravelMode.DRIVING,
        unitSystem:   window.google.maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        if (status !== 'OK' || !response) {
          setError('Could not calculate distance. Please check your address and try again.');
          setLoading(false);
          return;
        }

        // driver → customer
        const driverEl = response.rows[0]?.elements[0];
        // customer → supercharger
        const scEl     = response.rows[1]?.elements[1];

        if (!driverEl || driverEl.status !== 'OK') {
          setError('Location not reachable by road. Please enter a different address.');
          setLoading(false);
          return;
        }

        const distanceMiles      = driverEl.distance.value * 0.000621371;
        const drivingMinutes     = Math.ceil(driverEl.duration.value / 60);
        const etaMinutes         = drivingMinutes + BUFFER_MINUTES;
        const superchargerMiles  = scEl?.status === 'OK'
          ? Math.round(scEl.distance.value * 0.000621371 * 10) / 10
          : 0;

        // 3a — Block if driver distance is out of range (>50 mi)
        if (distanceMiles > TIER2_MAX_MILES) {
          // Fire-and-forget notification email
          fetch('/api/notify-out-of-range/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              address: location.address,
              distanceMiles: Math.round(distanceMiles * 10) / 10,
            }),
          }).catch(() => {});

          setError(
            `Your location is ${(Math.round(distanceMiles * 10) / 10).toFixed(1)} miles away — ` +
            `we’re not able to reach that area yet. We’re expanding soon!`
          );
          setLoading(false);
          return;
        }

        // 3b — Block if Supercharger is too far
        if (superchargerMiles > MAX_SUPERCHARGER_MILES) {
          setError(
            `The nearest Supercharger is ${superchargerMiles.toFixed(1)} miles away — ` +
            `we can only help if it's within ${MAX_SUPERCHARGER_MILES} miles.`
          );
          setLoading(false);
          return;
        }

        const now = new Date();
        const bd  = priceBreakdown(distanceMiles, now, superchargerMiles);

        setQuote({
          distanceMiles:    Math.round(distanceMiles * 10) / 10,
          drivingMinutes,
          etaMinutes,
          priceCents:       bd.total,
          depositCents:     bd.deposit,
          remainingCents:   bd.remaining,
          isRushHour:       bd.isRushHour,
          superchargerMiles,
          superchargerName,
          breakdown: { base: bd.base, extra: bd.extra, rushFee: bd.rushFee, rangeFee: bd.rangeFee },
        });
        setLoading(false);
      }
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div style={{ width: 48, height: 48, borderWidth: 4 }} className="spinner" />
        <p className="text-gray-400">Calculating your price & ETA…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">{error}</div>
        <button onClick={onBack} className="btn-secondary w-full">← Try Again</button>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="space-y-6">
      {/* Location confirmed */}
      <div className="flex items-start gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <span className="text-lg mt-0.5">📍</span>
        <div>
          <p className="text-xs text-gray-500 mb-1">Your location</p>
          <p className="text-sm font-medium text-gray-200">{location.address}</p>
        </div>
      </div>

      {/* ETA + Distance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-4xl font-black text-brand-cyan mb-1">~{quote.etaMinutes}</p>
          <p className="text-xs text-gray-400 uppercase tracking-widest">min ETA</p>
          <p className="text-xs text-gray-600 mt-1">incl. 20 min prep</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-black text-white mb-1">{quote.distanceMiles.toFixed(1)}</p>
          <p className="text-xs text-gray-400 uppercase tracking-widest">miles away</p>
        </div>
      </div>

      {/* Supercharger info */}
      <div className="flex items-start gap-3 p-4 bg-gray-900 rounded-xl border border-gray-800">
        <span className="text-lg mt-0.5">🔌</span>
        <div>
          <p className="text-xs text-gray-500 mb-1">Nearest Supercharger</p>
          <p className="text-sm font-medium text-gray-200">{quote.superchargerName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{quote.superchargerMiles.toFixed(1)} miles from your location</p>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Price Breakdown</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">
              Base rate ({quote.distanceMiles.toFixed(1)} mi
              {quote.distanceMiles <= TIER1_MAX_MILES ? ' — within 20 mi' : ' — 21–50 mi'})
            </span>
            <span>{formatUSD(quote.breakdown.base)}</span>
          </div>
          {quote.breakdown.rangeFee > 0 && (
            <div className="flex justify-between text-brand-cyan">
              <span className="text-gray-400">
                Range fee ({quote.superchargerMiles.toFixed(1)} mi to Supercharger)
              </span>
              <span>+{formatUSD(quote.breakdown.rangeFee)}</span>
            </div>
          )}
          {quote.isRushHour && (
            <div className="flex justify-between text-amber-400">
              <span>Rush hour premium ⏰</span>
              <span>+{formatUSD(quote.breakdown.rushFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t border-gray-700 text-lg font-bold">
            <span>Total</span>
            <span className="text-white">{formatUSD(quote.priceCents)}</span>
          </div>
          <div className="flex justify-between text-brand-cyan font-semibold">
            <span>Deposit today (10%)</span>
            <span>{formatUSD(quote.depositCents)}</span>
          </div>
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Balance due on arrival</span>
            <span>{formatUSD(quote.remainingCents)}</span>
          </div>
        </div>
      </div>

      {quote.isRushHour && (
        <div className="p-3 bg-amber-900/20 border border-amber-800/40 rounded-xl text-amber-400 text-xs">
          ⏰ Rush hour surcharge applied — we're busier right now but still on the way!
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button onClick={() => onNext(quote)} className="btn-primary flex-1">Continue to Book</button>
      </div>
    </div>
  );
}
