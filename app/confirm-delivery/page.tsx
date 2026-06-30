'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams }               from 'next/navigation';
import Image                             from 'next/image';
import Link                              from 'next/link';
import { formatUSD }                     from '@/lib/pricing';
import type { BalanceLinkPayload }       from '@/lib/booking-token';

function Spinner() {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center">
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
    </div>
  );
}

function ConfirmDeliveryContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [booking,   setBooking]   = useState<BalanceLinkPayload | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [paid,      setPaid]      = useState(false);
  const [captureError, setCaptureError] = useState('');

  useEffect(() => {
    if (!token) { setLoadError('Missing payment link.'); setLoading(false); return; }
    fetch(`/api/bookings/verify-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else setBooking(data);
        setLoading(false);
      })
      .catch(() => { setLoadError('Failed to load booking details.'); setLoading(false); });
  }, [token]);

  const handleCapture = async () => {
    setCapturing(true);
    setCaptureError('');
    try {
      const res  = await fetch('/api/bookings/charge-balance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Capture failed');
      setPaid(true);
    } catch (err: any) {
      setCaptureError(err?.message ?? 'Something went wrong. Please try again.');
      setCapturing(false);
    }
  };

  if (loading) return <Spinner />;

  /* Expired / invalid */
  if (loadError || !booking) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-6">⚠️</p>
          <h1 className="text-2xl font-bold mb-3">Link Expired</h1>
          <p className="text-gray-400 mb-8">{loadError || 'This payment link is no longer valid.'}</p>
          <Link href="/" className="btn-primary">Return Home</Link>
        </div>
      </div>
    );
  }

  /* Paid */
  if (paid) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">⚡</div>
          <h1 className="text-3xl font-bold text-brand-cyan mb-3">All paid up!</h1>
          <p className="text-gray-300 mb-2">
            Thanks, {booking.customerName}! Your remaining balance of{' '}
            <span className="text-white font-bold">{formatUSD(booking.remainingCents)}</span> has been collected.
          </p>
          <p className="text-gray-500 text-sm mt-4">Thanks for riding with Cyber Juice. Stay charged! ⚡</p>
        </div>
      </div>
    );
  }

  /* Main page */
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center px-6 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/cybertruck.png" alt="Cybertruck" width={32} height={22} className="object-contain" />
          <div className="brand-wordmark text-base leading-none flex flex-col items-start">
            <span>CYBER</span>
            <span className="text-brand-cyan">JUICE</span>
          </div>
        </Link>
      </nav>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔋</div>
          <h1 className="text-2xl font-bold mb-2">Got your charge?</h1>
          <p className="text-gray-400">Tap below and we'll collect the remaining balance — no checkout needed.</p>
        </div>

        {/* Balance card */}
        <div className="card mb-8">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Balance Due</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Service total</span>
              <span>{formatUSD(booking.totalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Deposit paid</span>
              <span className="text-green-400">− {formatUSD(booking.depositCents)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-700">
              <span>Remaining balance</span>
              <span className="text-brand-cyan">{formatUSD(booking.remainingCents)}</span>
            </div>
          </div>
        </div>

        {captureError && (
          <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm mb-4">
            {captureError}
          </div>
        )}

        <button
          onClick={handleCapture}
          disabled={capturing}
          className="btn-primary w-full text-lg py-5 glow-cyan flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {capturing ? (
            <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> Processing…</>
          ) : (
            <><span>⚡</span> I Received My Cyber Juice</>
          )}
        </button>

        <p className="text-xs text-center text-gray-600 mt-4">
          Your card was pre-authorized at booking. This just completes the charge.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmDeliveryPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ConfirmDeliveryContent />
    </Suspense>
  );
}
