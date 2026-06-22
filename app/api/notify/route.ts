import { NextRequest, NextResponse } from 'next/server';
import type { LocationData, QuoteData, ContactInfo } from '@/lib/types';
import { formatUSD } from '@/lib/pricing';

interface NotifyPayload {
  location:     LocationData;
  quote:        QuoteData;
  contact:      ContactInfo;
  paypalOrderId: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: NotifyPayload = await req.json();
    const { location, quote, contact, paypalOrderId } = body;

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const message = [
      '🚨 NEW BOOKING — On the Way',
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📅 ${now}`,
      `👤 ${contact.name}`,
      `📱 ${contact.phone}`,
      `📧 ${contact.email}`,
      ``,
      `📍 ${location.address}`,
      `📏 ${quote.distanceMiles} miles · ~${quote.etaMinutes} min ETA`,
      ``,
      `💰 Total: ${formatUSD(quote.priceCents)}`,
      `💳 Deposit Paid: ${formatUSD(quote.depositCents)}`,
      `🤝 Balance Due: ${formatUSD(quote.remainingCents)}`,
      ``,
      `🆔 PayPal Order: ${paypalOrderId}`,
    ].join('\n');

    const results = { sms: false, email: false, errors: [] as string[] };

    // ── SMS via Twilio ─────────────────────────────────────────────────────────
    const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone   = process.env.TWILIO_FROM_NUMBER;
    const toPhone     = process.env.ALERT_PHONE_NUMBER;

    if (twilioSid && twilioToken && fromPhone && toPhone) {
      try {
        const twilio = (await import('twilio')).default;
        const client = twilio(twilioSid, twilioToken);
        await client.messages.create({ body: message, from: fromPhone, to: toPhone });
        results.sms = true;
      } catch (err: any) {
        results.errors.push(`SMS: ${err.message}`);
        console.error('Twilio error:', err);
      }
    } else {
      results.errors.push('SMS: Twilio not configured');
    }

    // ── Email via Nodemailer ───────────────────────────────────────────────────
    const smtpUser  = process.env.SMTP_USER;
    const smtpPass  = process.env.SMTP_PASS;
    const alertEmail = process.env.ALERT_EMAIL;

    if (smtpUser && smtpPass && alertEmail) {
      try {
        const nodemailer = (await import('nodemailer')).default;
        const transporter = nodemailer.createTransport({
          host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
          port:   parseInt(process.env.SMTP_PORT ?? '587'),
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        });

        await transporter.sendMail({
          from:    `"On the Way Bookings" <${process.env.FROM_EMAIL ?? smtpUser}>`,
          to:      alertEmail,
          subject: `🚨 New Booking — ${contact.name} · ${formatUSD(quote.priceCents)}`,
          text:    message,
          html: `<pre style="font-family:monospace;white-space:pre-wrap">${message}</pre>`,
        });
        results.email = true;
      } catch (err: any) {
        results.errors.push(`Email: ${err.message}`);
        console.error('Nodemailer error:', err);
      }
    } else {
      results.errors.push('Email: SMTP not configured');
    }

    return NextResponse.json(results);
  } catch (err: any) {
    console.error('/api/notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
