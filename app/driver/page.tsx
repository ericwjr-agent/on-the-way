'use client';

import { useState } from 'react';
import Link from 'next/link';
import emailjs from '@emailjs/browser';

export default function DriverPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    hasCybertruck: '', experience: '', message: '',
  });
  const [status,   setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const serviceId  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_DRIVER_TEMPLATE_ID;
    const publicKey  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

    try {
      if (serviceId && templateId && publicKey) {
        await emailjs.send(serviceId, templateId, {
          driver_name:     form.name,
          driver_email:    form.email,
          driver_phone:    form.phone,
          driver_city:     form.city || 'N/A',
          has_cybertruck:  form.hasCybertruck === 'yes' ? 'Yes ✅' : 'No ❌',
          experience:      form.experience || 'N/A',
          extra_message:   form.message || 'N/A',
        }, publicKey);
      }
      setStatus('success');
    } catch {
      setErrorMsg('Something went wrong. Please try again or email us directly.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <img src="/cybertruck.png" alt="Cybertruck" width={32} height={22} className="object-contain" />
          <span className="brand-wordmark text-lg">
            CYBER <span className="text-brand-cyan">JUICE</span>
          </span>
        </Link>
        <Link href="/book" className="btn-primary text-sm py-2 px-5">Get Help Now</Link>
      </nav>

      {/* Hero */}
      <div className="relative py-20 px-6 text-center bg-grid overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-purple/15 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="mb-6">
            <img src="/cybertruck.png" alt="Cybertruck" width={280} className="mx-auto object-contain rounded-xl" />
          </div>
          <h1 className="text-5xl font-black mb-4">
            Drive with <span className="text-brand-cyan brand-wordmark">Cyber Juice</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            Own a Cybertruck? Turn it into an income stream. Join our network of
            emergency charge providers and earn on your schedule.
          </p>
        </div>
      </div>

      {/* Benefits */}
      <section className="py-16 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            { icon: '💰', title: 'Earn Per Call',   desc: 'Get paid for each dispatch you accept. Top drivers earn $500+ per weekend.' },
            { icon: '📅', title: 'Your Schedule',   desc: 'Go online when you want. Accept or decline any call. No minimums.' },
            { icon: '⚡', title: 'EV Revolution',  desc: "Be part of solving range anxiety. You're not just earning — you're making EVs work." },
          ].map((b) => (
            <div key={b.title} className="card text-center hover:border-brand-cyan/30 transition-colors">
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="font-bold text-lg mb-2">{b.title}</h3>
              <p className="text-gray-400 text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application form */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">Apply to Drive</h2>
          <p className="text-gray-400 text-center mb-10">Takes less than 2 minutes. We'll be in touch within 48 hours.</p>

          {status === 'success' ? (
            <div className="text-center py-16">
              <div className="text-7xl mb-6">🎉</div>
              <h3 className="text-2xl font-bold mb-3 text-brand-cyan">Application received!</h3>
              <p className="text-gray-400 mb-8">
                Thanks, {form.name}! We'll review your application and reach out to {form.email} within 48 hours.
              </p>
              <Link href="/" className="btn-secondary px-8 py-3 inline-block">Back to Home</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                  <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)}
                    placeholder="Jane Smith" className="input-brand" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                  <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)}
                    placeholder="(404) 555-0100" className="input-brand" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                  placeholder="jane@example.com" className="input-brand" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your City / Metro Area</label>
                <input type="text" value={form.city} onChange={(e) => update('city', e.target.value)}
                  placeholder="Atlanta, GA" className="input-brand" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Do you own a Cybertruck? *</label>
                <div className="grid grid-cols-2 gap-3">
                  {['yes', 'no'].map((val) => (
                    <button key={val} type="button" onClick={() => update('hasCybertruck', val)}
                      className={`py-3 rounded-xl border font-medium transition-all capitalize
                        ${form.hasCybertruck === val
                          ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                      {val === 'yes' ? '✅ Yes' : '❌ No (not yet!)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Any EV or roadside assistance experience?</label>
                <select value={form.experience} onChange={(e) => update('experience', e.target.value)}
                  className="input-brand">
                  <option value="">Select…</option>
                  <option value="none">None — but I'm ready to learn</option>
                  <option value="some">Some EV knowledge</option>
                  <option value="roadside">Roadside / towing experience</option>
                  <option value="tech">EV tech / automotive professional</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Anything else?</label>
                <textarea value={form.message} onChange={(e) => update('message', e.target.value)}
                  placeholder="Tell us a bit about yourself…" rows={3} className="input-brand resize-none" />
              </div>

              {status === 'error' && <p className="text-red-400 text-sm">{errorMsg}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !form.name || !form.email || !form.phone || !form.hasCybertruck}
                className="btn-primary w-full flex items-center justify-center gap-3"
              >
                {status === 'loading' ? <><span className="spinner" /> Submitting…</> : <>Submit Application →</>}
              </button>

              <p className="text-xs text-center text-gray-600">
                By applying you agree to our background check process and driver terms.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-2">
          <img src="/cybertruck.png" alt="Cybertruck" width={28} height={20} className="object-contain" />
          <span className="brand-wordmark text-sm text-white">CYBER JUICE</span>
        </Link>
        <p>© {new Date().getFullYear()} Cyber Juice. All rights reserved.</p>
      </footer>
    </div>
  );
}
