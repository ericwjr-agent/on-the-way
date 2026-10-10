// Pure, DOM-free logic for the "notify on real website visitor" feature.
// Kept separate from the API route so it can be unit-tested without mocking
// Next.js request/response objects or network calls.
//
// Mirrors cyber-ride's lib/visitor-alert.ts — kept as a duplicate (not a
// shared package) since these are two independently deployed Next.js apps.

const SITE_HOST = 'getcyberjuice.com';

/**
 * Known bot/crawler/test-automation user-agent substrings.
 * Keeping this list means we don't alert Eric every time a search engine
 * crawler, uptime monitor, or our own Playwright e2e suite hits the site.
 */
const BOT_UA_PATTERNS: RegExp[] = [
  /bot/i,
  /spider/i,
  /crawl/i,
  /slurp/i,
  /bingpreview/i,
  /facebookexternalhit/i,
  /vercel-screenshot/i,
  /headlesschrome/i,
  /playwright/i,
  /puppeteer/i,
  /lighthouse/i,
  /pingdom/i,
  /uptimerobot/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /axios\//i,
  /node-fetch/i,
];

/** Returns true if the given User-Agent looks like a bot/crawler/automated test client. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || !userAgent.trim()) return true; // no UA at all — treat as bot/suspicious
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export interface VisitorAlertInput {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  timestamp?: Date;
}

/** Build the human-readable Slack alert text for a real visitor hit. */
export function buildVisitorAlertMessage(input: VisitorAlertInput): string {
  const { path, referrer, timestamp = new Date() } = input;

  const time = timestamp.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const refLine = referrer && referrer.trim() && !referrer.includes(SITE_HOST)
    ? `\nFrom: ${referrer}`
    : '';

  return `👀 New visitor on ${SITE_HOST}\nPage: ${path}${refLine}\n${time} ET`;
}

/**
 * Decide whether this hit should trigger an alert at all.
 * Centralizes the bot-filtering + basic sanity checks used by the API route.
 */
export function shouldAlertForVisit(input: { userAgent?: string | null; path?: string | null }): boolean {
  if (isBotUserAgent(input.userAgent)) return false;
  if (!input.path || !input.path.trim()) return false;
  return true;
}
