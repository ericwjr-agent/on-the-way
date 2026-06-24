'use client';

import Link from 'next/link';
import CybertruckIcon from '@/components/CybertruckIcon';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4
                      bg-brand-dark/80 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-xl font-bold tracking-tight">
            On the <span className="text-brand-cyan">Way</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/driver" className="text-sm text-gray-400 hover:text-white transition-colors">
            Drive with us
          </Link>
          <Link href="/book" className="btn-primary text-sm py-2 px-5">
            Get Help Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center
                          px-6 pt-20 pb-12 bg-grid">

        {/* Background glow blobs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
                        bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px]
                        bg-brand-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-cyan/10 border border-brand-cyan/30
                          rounded-full px-4 py-1.5 text-brand-cyan text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse-slow" />
            Powered by Cybertruck Fleet
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
            Dead Battery?<br />
            <span className="text-brand-cyan glow-cyan-text">We're On the Way.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            On-demand emergency EV charging, dispatched from our Cybertruck fleet.
            We boost you enough to reach the nearest charger — fast.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/book"
                  className="btn-primary text-lg py-5 px-10 glow-cyan flex items-center gap-3">
              <span>⚡</span>
              Request Emergency Charge
            </Link>
            <Link href="/driver" className="btn-secondary text-lg py-5 px-10 flex items-center gap-3">
              <CybertruckIcon className="w-7 h-7" />
              Become a Driver
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { label: 'Avg Response', value: '< 30 min' },
              { label: 'Starting At',  value: '$100'     },
              { label: 'Coverage',     value: 'ATL Metro' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-brand-cyan">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                     text-gray-600 hover:text-gray-400 text-sm animate-bounce transition-colors cursor-pointer">
          <span>Learn more</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-gray-400 text-center mb-16 text-lg">Back on the road in minutes, not hours.</p>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: '📍', step: '01', title: 'Drop Your Pin', desc: 'Share your location or type your address. We calculate your ETA and price instantly.' },
              { icon: '💳', step: '02', title: 'Reserve & Pay', desc: 'Pay a small 10% deposit to secure your spot. No surprises — full price shown upfront.' },
              { icon: '⚡', step: '03', title: 'Cybertruck Dispatched', desc: "Your driver is on the way. You'll get a text with real-time location sharing." },
              { icon: '🔋', step: '04', title: 'Charged & Rolling', desc: "We give you enough juice to reach the nearest charger. For a Model 3, just 12 minutes of charge is enough for 5 miles — plenty to get you moving. Simple, fast, done." },
            ].map((item) => (
              <div key={item.step} className="card hover:border-brand-cyan/40 transition-colors group">
                <div className="text-3xl mb-4">{item.icon}</div>
                <p className="text-brand-cyan font-mono text-sm mb-2">{item.step}</p>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Transparent Pricing</h2>
          <p className="text-gray-400 mb-12 text-lg">Know exactly what you're paying before we dispatch.</p>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            <div className="card border-brand-cyan/30">
              <h3 className="font-bold text-lg mb-4 text-brand-cyan">Distance from Atlanta</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex justify-between items-center">
                  <span>Within 20 miles</span>
                  <span className="font-bold text-white">$100</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>21–50 miles</span>
                  <span className="font-bold text-white">$200</span>
                </li>
                <li className="flex justify-between items-center pt-2 border-t border-gray-700 text-gray-500 text-xs">
                  <span>Over 50 miles</span>
                  <span>Not available yet</span>
                </li>
              </ul>
            </div>
            <div className="card">
              <h3 className="font-bold text-lg mb-4 text-amber-400">Surcharges</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex justify-between items-start">
                  <div>
                    <p className="text-white">Rush Hour</p>
                    <p className="text-gray-500 text-xs">Mon–Fri 7–9 AM · 4–6 PM</p>
                  </div>
                  <span className="font-bold text-amber-400">+$50</span>
                </li>
                <li className="flex justify-between items-start pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-white">Range Fee</p>
                    <p className="text-gray-500 text-xs">Per 5 mi to nearest Supercharger (after first 5 mi)</p>
                  </div>
                  <span className="font-bold text-brand-cyan">+$20</span>
                </li>
                <li className="flex justify-between items-start pt-3 border-t border-gray-700">
                  <div>
                    <p className="text-white">Deposit at booking</p>
                    <p className="text-gray-500 text-xs">Balance due on arrival</p>
                  </div>
                  <span className="font-bold text-brand-cyan">10%</span>
                </li>
              </ul>

            </div>
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand-purple/20 via-transparent to-brand-cyan/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-6">
            <CybertruckIcon className="w-24 h-24 mx-auto" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Own a Cybertruck?</h2>
          <p className="text-gray-400 text-xl mb-8">
            Join our network of emergency charge providers. Set your own hours,
            earn per dispatch, and be part of the EV revolution.
          </p>
          <Link href="/driver" className="btn-secondary text-lg py-4 px-10 inline-block">
            Apply to Drive
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span>⚡</span>
          <span className="font-semibold text-white">On the Way</span>
        </div>
        <p>Emergency EV Charging · Atlanta Metro Area</p>
        <p className="mt-2 text-gray-600">© {new Date().getFullYear()} On the Way. All rights reserved.</p>
      </footer>
    </div>
  );
}
