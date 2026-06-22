# ⚡ On the Way

> On-demand emergency EV charging, powered by Cybertrucks.

## What is this?

**On the Way** is an emergency EV charging service. Customers who've run out of battery on local roads can book a Cybertruck dispatch for a quick charge boost — enough to reach the nearest station.

## Features

- 📍 **Address or GPS location** — Google Places autocomplete or one-tap geolocation
- 💰 **Instant pricing** — distance-based + rush hour premiums, shown upfront
- 💳 **PayPal checkout** — 10% deposit at booking, balance due on arrival
- 📱 **SMS + email alerts** — operator notified instantly on every booking
- 🚗 **Driver signup** — Cybertruck owners can apply to join the network

## Pricing

| Distance      | Price |
|---------------|-------|
| Up to 15 mi   | $100  |
| 15–25 mi      | $150  |
| 25–35 mi      | $200  |
| 35–45 mi      | $250  |
| +10 mi bands  | +$50  |

Rush hour (Mon–Fri 7–9 AM / 4–6 PM ET): +$100

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Payments**: PayPal REST API
- **Location**: Google Maps (Places + Distance Matrix)
- **Notifications**: Twilio (SMS) + Nodemailer (email)
- **Hosting**: Vercel (auto-deploys from `main`)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (Places + Distance Matrix) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal secret (server-side only) |
| `PAYPAL_MODE` | `sandbox` or `live` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Your Twilio phone number |
| `ALERT_PHONE_NUMBER` | Phone number to alert on new bookings |
| `SMTP_HOST` | SMTP server (default: smtp.gmail.com) |
| `SMTP_PORT` | SMTP port (default: 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP app password |
| `ALERT_EMAIL` | Email address to alert on new bookings |
| `FROM_EMAIL` | From address for booking emails |
| `NEXT_PUBLIC_APP_URL` | Production URL |

## Development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

## Deploy to Vercel

1. Import this repo in [vercel.com](https://vercel.com)
2. Add all environment variables in Vercel dashboard
3. Every push to `main` auto-deploys

## Code Owners

- [@ericwjr](https://github.com/ericwjr) — owner
- [@ericwjr-agent](https://github.com/ericwjr-agent) — Carter (AI manager)
