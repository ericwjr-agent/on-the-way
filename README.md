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

- **Framework**: Next.js 14 (App Router, static export)
- **Styling**: Tailwind CSS
- **Payments**: PayPal (client-side SDK — 10% deposit)
- **Location**: Google Maps (Places + Distance Matrix)
- **Notifications**: EmailJS (client-side email on booking + driver signup)
- **Hosting**: GitHub Pages (auto-deploys from `main` via GitHub Actions)

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (Places + Distance Matrix) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal client ID |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | EmailJS service ID |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | EmailJS template ID (booking alert) |
| `NEXT_PUBLIC_EMAILJS_DRIVER_TEMPLATE_ID` | EmailJS template ID (driver signup) |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | EmailJS public key |

## Development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

## Deploy to GitHub Pages

1. Add all environment variables as **GitHub repo secrets** at:
   `Settings → Secrets and variables → Actions`
2. Every push to `main` auto-deploys via GitHub Actions
3. Live at: `https://ericwjr-agent.github.io/on-the-way`

## Code Owners

- [@ericwjr](https://github.com/ericwjr) — owner
- [@ericwjr-agent](https://github.com/ericwjr-agent) — Carter (AI manager)
