'use client';

import { useState } from 'react';
import { formatUSD } from '@/lib/pricing';
import type { QuoteData, ContactInfo } from '@/lib/types';

interface Props {
  quote: QuoteData;
  onNext: (contact: ContactInfo) => void;
  onBack: () => void;
}

export default function ContactStep({ quote, onNext, onBack }: Props) {
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    onNext({ name: name.trim(), phone: cleanPhone, email: email.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mini price reminder */}
      <div className="flex justify-between items-center p-4 bg-gray-900 rounded-xl border border-gray-800 text-sm">
        <div>
          <p className="text-gray-400">Total charge</p>
          <p className="font-bold text-lg">{formatUSD(quote.priceCents)}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400">Deposit due now</p>
          <p className="font-bold text-lg text-brand-cyan">{formatUSD(quote.depositCents)}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className="input-brand"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(404) 555-0100"
          className="input-brand"
          required
        />
        <p className="text-xs text-gray-600 mt-1">
          Your driver will text this number with their live location.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          className="input-brand"
          required
        />
        <p className="text-xs text-gray-600 mt-1">Booking confirmation will be sent here.</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">← Back</button>
        <button type="submit" className="btn-primary flex-1">Continue to Payment</button>
      </div>
    </form>
  );
}
