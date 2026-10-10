'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fires a one-shot beacon to /api/track on every page view so the site
 * owner gets a Slack alert when a real visitor (not a bot/crawler) hits
 * the site. Fails silently — never blocks or slows down the page.
 */
export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      }),
      keepalive: true,
    }).catch(() => {
      // Tracking is best-effort; never surface errors to the user.
    });
  }, [pathname]);

  return null;
}
