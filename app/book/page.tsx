import BookingFlow from '@/components/BookingFlow';
import Link from 'next/link';

export const metadata = {
  title: 'Book Emergency Charge — On the Way',
};

export default function BookPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-bold">
            On the <span className="text-brand-cyan">Way</span>
          </span>
        </Link>
        <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back
        </Link>
      </nav>

      <div className="max-w-xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Request Emergency Charge</h1>
        <p className="text-gray-400 mb-8">We'll dispatch a Cybertruck to your location.</p>
        <BookingFlow />
      </div>
    </div>
  );
}
