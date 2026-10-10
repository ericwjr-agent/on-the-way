import { NextResponse } from 'next/server';
import { shouldAlertForVisit, buildVisitorAlertMessage } from '@/lib/visitor-alert';

/**
 * Lightweight visitor-tracking beacon. Called once per page load from the
 * client (see app/layout.tsx). Filters out bots/crawlers/automation, then
 * posts a Slack alert to the owner so they know in near-real-time when a
 * real human is on the site.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const path: string = body?.path ?? '/';
    const referrer: string | undefined = body?.referrer;
    const userAgent = request.headers.get('user-agent');

    if (!shouldAlertForVisit({ userAgent, path })) {
      return NextResponse.json({ ok: true, alerted: false });
    }

    const slackToken = process.env.SLACK_BOT_TOKEN;
    const slackChannel = process.env.VISITOR_ALERT_SLACK_CHANNEL;

    if (!slackToken || !slackChannel) {
      // Not configured — silently no-op rather than failing the request.
      return NextResponse.json({ ok: true, alerted: false, reason: 'slack not configured' });
    }

    const message = buildVisitorAlertMessage({ path, referrer, timestamp: new Date() });

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${slackToken}`,
      },
      body: JSON.stringify({ channel: slackChannel, text: message }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error('Slack visitor alert failed:', result.error);
      return NextResponse.json({ ok: true, alerted: false, reason: result.error });
    }

    return NextResponse.json({ ok: true, alerted: true });
  } catch (err) {
    console.error('track error:', err);
    // Never fail the page for a tracking error.
    return NextResponse.json({ ok: true, alerted: false });
  }
}
