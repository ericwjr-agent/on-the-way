import { Resend } from 'resend';
import { formatUSD } from './pricing';

// Lazy-init so the client isn't constructed at build time
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getFrom()      { return process.env.RESEND_FROM_EMAIL  ?? 'Cyber Juice <onboarding@resend.dev>'; }
function getHostEmail() { return process.env.RESEND_HOST_EMAIL  ?? ''; }

export interface BookingEmailData {
  customerName:   string;
  customerEmail:  string;
  customerPhone:  string;
  address:        string;
  etaMinutes:     number;
  distanceMiles:  number;
  totalCents:     number;
  depositCents:   number;
  remainingCents: number;
  isRushHour:     boolean;
  bookingTime:    string;
  balanceLink:    string;
}

/* ── Send both emails in parallel ─────────────────────────────── */
export async function sendBookingEmails(data: BookingEmailData) {
  const sends = [sendCustomerConfirmation(data)];
  if (getHostEmail()) sends.push(sendHostAlert(data));
  const results = await Promise.allSettled(sends);
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`Email send ${i} failed:`, r.reason);
    }
  });
}

/* ── Host alert ────────────────────────────────────────────────── */
async function sendHostAlert(data: BookingEmailData) {
  return getResend().emails.send({
    from:     getFrom(),
    to:       getHostEmail(),
    replyTo:  'Eric@nativelab.co',
    subject:  `🚨 New Booking — ${data.customerName} @ ${data.address}`,
    html:     hostAlertHtml(data),
  });
}

/* ── Customer confirmation ─────────────────────────────────────── */
async function sendCustomerConfirmation(data: BookingEmailData) {
  return getResend().emails.send({
    from:     getFrom(),
    to:       data.customerEmail,
    replyTo:  'Eric@nativelab.co',
    subject:  `⚡ Your Cyber Juice is on the way, ${data.customerName}!`,
    html:     customerConfirmationHtml(data),
  });
}

/* ════════════════════════════════════════════════════════════════
   EMAIL TEMPLATES
   ════════════════════════════════════════════════════════════════ */

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,-apple-system,sans-serif;color:#ffffff;">
  <div style="max-width:540px;margin:0 auto;padding:40px 24px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:36px;">
      <span style="font-size:26px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;">
        CYBER&nbsp;<span style="color:#00d4ff;">JUICE</span>
      </span>
    </div>

    ${content}

    <!-- Footer -->
    <div style="text-align:center;color:#4b5563;font-size:12px;border-top:1px solid #1f2937;padding-top:24px;margin-top:40px;">
      <p style="margin:0 0 4px;">Cyber Juice · Emergency EV Charging · Atlanta Metro</p>
    </div>
  </div>
</body>
</html>`;
}

/* ── Customer confirmation template ────────────────────────────── */
function customerConfirmationHtml(d: BookingEmailData): string {
  return base(`
    <!-- Hero -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:60px;margin-bottom:12px;">⚡</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#ffffff;">
        You're confirmed, ${d.customerName}!
      </h1>
      <p style="margin:0;color:#9ca3af;font-size:15px;">
        A Cybertruck is being dispatched to your location.
      </p>
    </div>

    <!-- Booking summary -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">
        Booking Summary
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">Location</td>
          <td style="text-align:right;color:#fff;">${d.address}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">ETA</td>
          <td style="text-align:right;color:#fff;">~${d.etaMinutes} min</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">Service Total</td>
          <td style="text-align:right;color:#fff;">${formatUSD(d.totalCents)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">Deposit Paid Today</td>
          <td style="text-align:right;color:#34d399;font-weight:600;">${formatUSD(d.depositCents)}</td>
        </tr>
        <tr style="border-top:1px solid #374151;">
          <td style="padding:10px 0 4px;font-weight:700;font-size:15px;">Balance Due on Arrival</td>
          <td style="text-align:right;padding:10px 0 4px;font-weight:700;font-size:15px;color:#00d4ff;">
            ${formatUSD(d.remainingCents)}
          </td>
        </tr>
      </table>
    </div>

    <!-- What's next -->
    <div style="background:#0f172a;border:1px solid #1e3a5f;border-radius:12px;padding:16px;margin-bottom:32px;">
      <p style="margin:0 0 6px;font-weight:600;font-size:14px;">📱 What happens next</p>
      <p style="margin:0;color:#93c5fd;font-size:13px;">
        Your driver will text <strong>${d.customerPhone}</strong> with their live location once they're en route.
      </p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin-bottom:12px;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">
        Once your vehicle is charged, tap below to pay your remaining balance:
      </p>
      <a href="${d.balanceLink}"
         style="display:inline-block;background:#00d4ff;color:#000000;font-weight:800;
                font-size:17px;text-decoration:none;padding:18px 36px;border-radius:14px;
                letter-spacing:0.01em;box-shadow:0 0 24px rgba(0,212,255,0.35);">
        ⚡&nbsp;&nbsp;I Received My Cyber Juice
      </a>
    </div>
    <p style="text-align:center;color:#4b5563;font-size:12px;margin:0;">
      This link expires in 72 hours.
    </p>
  `);
}

/* ── Host alert template ───────────────────────────────────────── */
function hostAlertHtml(d: BookingEmailData): string {
  const rushBadge = d.isRushHour
    ? '<span style="background:#d97706;color:#000;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:8px;">RUSH HOUR</span>'
    : '';

  return base(`
    <!-- Alert header -->
    <div style="background:#111827;border:1px solid #374151;border-radius:16px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">
        New Booking ${rushBadge}
      </p>
      <h2 style="margin:8px 0 0;font-size:20px;font-weight:800;">${d.customerName}</h2>
      <p style="margin:4px 0 0;color:#9ca3af;font-size:14px;">${d.bookingTime}</p>
    </div>

    <!-- Customer details -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">
        Customer
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:5px 0;color:#9ca3af;width:120px;">Phone</td><td style="color:#fff;">${d.customerPhone}</td></tr>
        <tr><td style="padding:5px 0;color:#9ca3af;">Email</td><td style="color:#fff;">${d.customerEmail}</td></tr>
        <tr><td style="padding:5px 0;color:#9ca3af;">Location</td><td style="color:#fff;">${d.address}</td></tr>
        <tr><td style="padding:5px 0;color:#9ca3af;">Distance</td><td style="color:#fff;">${d.distanceMiles} mi · ETA ~${d.etaMinutes} min</td></tr>
      </table>
    </div>

    <!-- Financials -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:16px;padding:24px;">
      <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;">
        Financials
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">Service Total</td>
          <td style="text-align:right;color:#fff;font-weight:600;">${formatUSD(d.totalCents)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#9ca3af;">Deposit Collected</td>
          <td style="text-align:right;color:#34d399;font-weight:600;">${formatUSD(d.depositCents)}</td>
        </tr>
        <tr style="border-top:1px solid #374151;">
          <td style="padding:10px 0 4px;font-weight:700;">Balance to Collect</td>
          <td style="text-align:right;padding:10px 0 4px;color:#00d4ff;font-weight:700;">${formatUSD(d.remainingCents)}</td>
        </tr>
      </table>
    </div>
  `);
}
