'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams }               from 'next/navigation';
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

type PageState = 'idle' | 'capturing' | 'voiding' | 'captured' | 'voided' | 'error';

function AdminBookingContent() {
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [booking,   setBooking]   = useState<BalanceLinkPayload | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading,   setLoading]   = useState(true);
  const [state,     setState]     = useState<PageState>('idle');
  const [errorMsg,  setErrorMsg]  = useState('');

  useEffect(() => {
    if (!token) { setLoadError('Missing admin token.'); setLoading(false); return; }
    fetch(`/api/bookings/verify-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else setBooking(data);
        setLoading(false);
      })
      .catch(() => { setLoadError('Failed to load booking.'); setLoading(false); });
  }, [token]);

  const handleCapture = async () => {
    setState('capturing');
    setErrorMsg('');
    try {
      const res  = await fetch('/api/bookings/charge-balance', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Capture failed');
      setState('captured');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Something went wrong.');
      setState('error');
    }
  };

  const handleVoid = async () => {
    setState('voiding');
    setErrorMsg('');
    try {
      const res  = await fetch('/api/bookings/void-authorization', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? 'Void failed');
      setState('voided');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Something went wrong.');
      setState('error');
    }
  };

  if (loading) return <Spinner />;

  if (loadError || !booking) {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-6">⚠️</p>
          <h1 className="text-2xl font-bold mb-3">Link Expired</h1>
          <p className="text-gray-400 mb-8">{loadError || 'This admin link is no longer valid.'}</p>
          <Link href="/" className="btn-primary">Return Home</Link>
        </div>
      </div>
    );
  }

  if (state === 'captured') {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">⚡</div>
          <h1 className="text-3xl font-bold text-brand-cyan mb-3">Payment captured!</h1>
          <p className="text-gray-300 mb-2">
            {formatUSD(booking.remainingCents)} collected from {booking.customerName}.
          </p>
          <p className="text-gray-500 text-sm mt-4">All done. Stay charged! ⚡</p>
        </div>
      </div>
    );
  }

  if (state === 'voided') {
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="text-7xl mb-6">🔓</div>
          <h1 className="text-3xl font-bold text-gray-200 mb-3">Hold released</h1>
          <p className="text-gray-400 mb-2">
            The authorization for {booking.customerName} has been voided. No charge was made.
          </p>
        </div>
      </div>
    );
  }

  const busy = state === 'capturing' || state === 'voiding';

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="brand-wordmark text-base leading-none flex flex-col items-start">
            <span>CYBER</span>
            <span className="text-brand-cyan">JUICE</span>
          </div>
          <span className="ml-3 text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-lg uppercase tracking-widest">
            Admin
          </span>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold mb-2">Booking Admin</h1>
          <p className="text-gray-400 text-sm">Capture payment or release the hold for this booking.</p>
        </div>

        {/* Booking summary */}
        <div className="card mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Booking</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Customer</span>
              <span className="font-medium">{booking.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone</span>
              <span>{booking.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Location</span>
              <span className="text-right max-w-[60%] leading-snug">{booking.address}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-700 font-bold text-base">
              <span>Amount to capture</span>
              <span className="text-brand-cyan">{formatUSD(booking.remainingCents)}</span>
            </div>
          </div>
        </div>

        {(state === 'error') && errorMsg && (
          <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm mb-4">
            {errorMsg}
          </div>
        )}

        {/* Capture */}
        <button
          onClick={handleCapture}
          disabled={busy}
          className="btn-primary w-full text-lg py-5 glow-cyan flex items-center justify-center gap-3 disabled:opacity-50 mb-4"
        >
          {state === 'capturing' ? (
            <><div className="spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> Capturing…</>
          ) : (
            <><span>⚡</span> Capture Full Payment</>
          )}
        </button>

        {/* Void */}
        <button
          onClick={handleVoid}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 border border-gray-700 text-gray-400
                     hover:border-red-500/60 hover:text-red-400 py-4 rounded-xl transition-all text-sm
                     font-medium disabled:opacity-50"
        >
          {state === 'voiding' ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Releasing hold…</>
          ) : (
            <>🚫 I never received my Cyber Juice — Release Hold</>
          )}
        </button>

        <p className="text-xs text-center text-gray-600 mt-4">
          This admin link expires in 25 days. Keep it private.
        </p>
      </div>
    </div>
  );
}

export default function AdminBookingPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminBookingContent />
    </Suspense>
  );
}
