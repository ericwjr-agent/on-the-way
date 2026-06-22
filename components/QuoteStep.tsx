'use client';

import { useState, useEffect } from 'react';
import { formatUSD } from '@/lib/pricing';
import type { LocationData, QuoteData } from '@/lib/types';

interface Props {
  location: LocationData;
  onNext: (quote: QuoteData) => void;
  onBack: () => void;
}

export default function QuoteStep({ location, onNext, onBack }: Props) {
  const [quote,   setQuote]   = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: location.address, lat: location.lat, lng: location.lng }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? 'Failed to get quote');
        }
        const data: QuoteData = await res.json();
        setQuote(data);
      } catch (err: any) {
        setError(err.message ?? 'Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [location]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="spinner w-10 h-10 border-4" style={{ width: 48, height: 48, borderWidth: 4 }} />
        <p className="text-gray-400">Calculating your price & ETA…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
          {error}
        </div>
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

      {/* ETA */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <p className="text-4xl font-black text-brand-cyan mb-1">
            ~{quote.etaMinutes}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest">min ETA</p>
          <p className="text-xs text-gray-600 mt-1">incl. 20 min prep</p>
        </div>
        <div className="card text-center">
          <p className="text-4xl font-black text-white mb-1">
            {quote.distanceMiles.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-widest">miles away</p>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="card">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Price Breakdown</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Base rate (up to 15 mi)</span>
            <span>{formatUSD(quote.breakdown.base)}</span>
          </div>
          {quote.breakdown.extra > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Distance surcharge</span>
              <span>+{formatUSD(quote.breakdown.extra)}</span>
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
          ⏰ Rush hour surcharge applied — we're busier right now but still coming!
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button onClick={() => onNext(quote)} className="btn-primary flex-1">
          Continue to Book
        </button>
      </div>
    </div>
  );
}
