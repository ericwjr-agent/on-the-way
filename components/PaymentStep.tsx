'use client';

import { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { formatUSD } from '@/lib/pricing';
import type { LocationData, QuoteData, ContactInfo } from '@/lib/types';

interface Props {
  location: LocationData;
  quote:    QuoteData;
  contact:  ContactInfo;
  onSuccess: () => void;
  onBack:    () => void;
}

export default function PaymentStep({ location, quote, contact, onSuccess, onBack }: Props) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const createOrder = async () => {
    setError('');
    const res = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depositCents: quote.depositCents,
        description: `On the Way — Emergency Charge Deposit (${formatUSD(quote.priceCents)} total)`,
      }),
    });
    if (!res.ok) throw new Error('Could not create PayPal order');
    const { id } = await res.json();
    return id as string;
  };

  const onApprove = async (data: { orderID: string }) => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      if (!res.ok) throw new Error('Payment capture failed');

      // Send notification to ops team
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          quote,
          contact,
          paypalOrderId: data.orderID,
        }),
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Order summary */}
      <div className="card">
        <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Service total</span>
            <span>{formatUSD(quote.priceCents)}</span>
          </div>
          <div className="flex justify-between text-brand-cyan font-semibold">
            <span>Deposit charged today (10%)</span>
            <span>{formatUSD(quote.depositCents)}</span>
          </div>
          <div className="flex justify-between text-gray-500 text-xs pt-2 border-t border-gray-700">
            <span>Balance due on arrival</span>
            <span>{formatUSD(quote.remainingCents)}</span>
          </div>
        </div>

        <div className="space-y-1 text-xs text-gray-500 border-t border-gray-700 pt-3">
          <p><span className="text-gray-400">Name:</span> {contact.name}</p>
          <p><span className="text-gray-400">Phone:</span> {contact.phone}</p>
          <p><span className="text-gray-400">Email:</span> {contact.email}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {processing ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
          <p className="text-gray-400 text-sm">Processing your payment…</p>
        </div>
      ) : (
        <>
          {isPending && (
            <div className="flex items-center justify-center gap-3 py-4 text-gray-400 text-sm">
              <div className="spinner" />
              Loading payment…
            </div>
          )}
          <div className={isPending ? 'opacity-0' : 'opacity-100'}>
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => setError('PayPal error. Please try again.')}
            />
          </div>
        </>
      )}

      <p className="text-xs text-center text-gray-600">
        Secured by PayPal. Your card is charged {formatUSD(quote.depositCents)} now.
        The remaining {formatUSD(quote.remainingCents)} is due when your driver arrives.
      </p>

      {!processing && (
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-300 transition-colors w-full text-center">
          ← Go back
        </button>
      )}
    </div>
  );
}
