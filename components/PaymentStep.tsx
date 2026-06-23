'use client';

import { useState } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import emailjs from '@emailjs/browser';
import { formatUSD } from '@/lib/pricing';
import type { LocationData, QuoteData, ContactInfo } from '@/lib/types';

interface Props {
  location:  LocationData;
  quote:     QuoteData;
  contact:   ContactInfo;
  onSuccess: () => void;
  onBack:    () => void;
}

export default function PaymentStep({ location, quote, contact, onSuccess, onBack }: Props) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [error,      setError]      = useState('');
  const [processing, setProcessing] = useState(false);

  /** Fully client-side PayPal order via SDK actions */
  const createOrder = (_: unknown, actions: any) => {
    return actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: (quote.depositCents / 100).toFixed(2),
        },
        description: `On the Way — Emergency Charge Deposit (${formatUSD(quote.priceCents)} total)`,
      }],
      application_context: {
        brand_name:  'On the Way',
        user_action: 'PAY_NOW',
        return_url:  'https://ericwjr-agent.github.io/on-the-way/book/',
        cancel_url:  'https://ericwjr-agent.github.io/on-the-way/book/',
      },
    });
  };

  const onApprove = async (_: unknown, actions: any) => {
    setProcessing(true);
    setError('');
    try {
      await actions.order.capture();
      await sendEmailAlert();
      onSuccess();
    } catch (err: any) {
      setError(err?.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  async function sendEmailAlert() {
    const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
    const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    if (!serviceId || !templateId || !publicKey) return; // not configured — PayPal email covers it

    const now = new Date().toLocaleString('en-US', {
      timeZone:  'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    try {
      await emailjs.send(serviceId, templateId, {
        booking_time:     now,
        customer_name:    contact.name,
        customer_phone:   contact.phone,
        customer_email:   contact.email,
        customer_address: location.address,
        distance_miles:   quote.distanceMiles,
        eta_minutes:      quote.etaMinutes,
        total_price:      formatUSD(quote.priceCents),
        deposit_paid:     formatUSD(quote.depositCents),
        balance_due:      formatUSD(quote.remainingCents),
        rush_hour:        quote.isRushHour ? 'Yes (+$100)' : 'No',
      }, publicKey);
    } catch (err) {
      // Non-fatal — PayPal already sends merchant notification
      console.warn('EmailJS alert failed (non-fatal):', err);
    }
  }

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
        <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-red-400 text-sm">{error}</div>
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
          <div className={isPending ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
            <PayPalButtons
              style={{ layout: 'vertical', shape: 'rect', color: 'gold', label: 'pay' }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={() => setError('PayPal encountered an error. Please try again.')}
            />
          </div>
        </>
      )}

      <p className="text-xs text-center text-gray-600">
        Secured by PayPal. You're charged {formatUSD(quote.depositCents)} now.
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
