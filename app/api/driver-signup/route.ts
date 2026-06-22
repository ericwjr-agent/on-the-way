import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, city, hasCybertruck, experience, message: msg } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const now = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const notification = [
      '🚗 NEW DRIVER APPLICATION — On the Way',
      `━━━━━━━━━━━━━━━━━━━━━`,
      `📅 ${now}`,
      `👤 ${name}`,
      `📱 ${phone}`,
      `📧 ${email}`,
      `📍 ${city ?? 'N/A'}`,
      `🚗 Owns Cybertruck: ${hasCybertruck ? 'Yes ✅' : 'No ❌'}`,
      `🔧 Experience: ${experience ?? 'N/A'}`,
      `💬 Message: ${msg ?? 'N/A'}`,
    ].join('\n');

    const smtpUser   = process.env.SMTP_USER;
    const smtpPass   = process.env.SMTP_PASS;
    const alertEmail = process.env.ALERT_EMAIL;

    if (smtpUser && smtpPass && alertEmail) {
      const nodemailer = (await import('nodemailer')).default;
      const transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port:   parseInt(process.env.SMTP_PORT ?? '587'),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      await transporter.sendMail({
        from:    `"On the Way" <${smtpUser}>`,
        to:      alertEmail,
        subject: `🚗 New Driver Application — ${name}`,
        text:    notification,
        html:    `<pre style="font-family:monospace;white-space:pre-wrap">${notification}</pre>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('/api/driver-signup error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
