'use client';

import { useState } from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import LocationStep from './LocationStep';
import QuoteStep    from './QuoteStep';
import ContactStep  from './ContactStep';
import PaymentStep  from './PaymentStep';
import type { BookingStep, LocationData, QuoteData, ContactInfo } from '@/lib/types';

const STEPS: { key: BookingStep; label: string }[] = [
  { key: 'location',  label: 'Location'  },
  { key: 'quote',     label: 'Quote'     },
  { key: 'contact',   label: 'Contact'   },
  { key: 'payment',   label: 'Payment'   },
  { key: 'confirmed', label: 'Confirmed' },
];

export default function BookingFlow() {
  const [step,    setStep]    = useState<BookingStep>('location');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [quote,   setQuote]   = useState<QuoteData | null>(null);
  const [contact, setContact] = useState<ContactInfo | null>(null);

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div>
      {/* Step indicator */}
      {step !== 'confirmed' && (
        <div className="flex items-center mb-10">
          {STEPS.filter((s) => s.key !== 'confirmed').map((s, i) => {
            const idx  = STEPS.findIndex((x) => x.key === s.key);
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={s.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${active ? 'step-active' : done ? 'step-done' : 'step-pending'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${active ? 'text-brand-cyan' : done ? 'text-green-400' : 'text-gray-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.filter((s) => s.key !== 'confirmed').length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${idx < currentIdx ? 'bg-green-500' : 'bg-gray-800'}`} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Steps */}
      {step === 'location' && (
        <LocationStep
          onNext={(loc) => { setLocation(loc); setStep('quote'); }}
        />
      )}
      {step === 'quote' && location && (
        <QuoteStep
          location={location}
          onNext={(q) => { setQuote(q); setStep('contact'); }}
          onBack={() => setStep('location')}
        />
      )}
      {step === 'contact' && quote && (
        <ContactStep
          quote={quote}
          onNext={(c) => { setContact(c); setStep('payment'); }}
          onBack={() => setStep('quote')}
        />
      )}
      {step === 'payment' && location && quote && contact && (
        <PayPalScriptProvider options={{
          clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? 'test',
          currency: 'USD',
        }}>
          <PaymentStep
            location={location}
            quote={quote}
            contact={contact}
            onSuccess={() => setStep('confirmed')}
            onBack={() => setStep('contact')}
          />
        </PayPalScriptProvider>
      )}
      {step === 'confirmed' && location && quote && contact && (
        <ConfirmedView location={location} quote={quote} contact={contact} />
      )}
    </div>
  );
}

function ConfirmedView({
  location, quote, contact
}: { location: LocationData; quote: QuoteData; contact: ContactInfo }) {
  const { formatUSD } = require('@/lib/pricing');

  return (
    <div className="text-center py-8">
      <div className="text-7xl mb-6">⚡</div>
      <h2 className="text-3xl font-bold text-brand-cyan mb-3">You're confirmed!</h2>
      <p className="text-gray-300 text-lg mb-8">
        A Cybertruck is being dispatched to your location right now.
      </p>

      <div className="card text-left mb-6">
        <h3 className="font-semibold mb-4 text-gray-300 uppercase text-xs tracking-widest">Booking Summary</h3>
        <div className="space-y-3 text-sm">
          <Row label="Location"    value={location.address} />
          <Row label="ETA"         value={`~${quote.etaMinutes} minutes`} />
          <Row label="Total Charge" value={formatUSD(quote.priceCents)} />
          <Row label="Deposit Paid" value={formatUSD(quote.depositCents)} className="text-green-400" />
          <Row label="Due on Arrival" value={formatUSD(quote.remainingCents)} />
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 text-sm text-blue-300 text-left">
        <p className="font-semibold mb-1">📱 What happens next</p>
        <p>Your driver will send you a text at <strong>{contact.phone}</strong> with their real-time location once they're en route.</p>
      </div>
    </div>
  );
}

function Row({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${className}`}>{value}</span>
    </div>
  );
}
