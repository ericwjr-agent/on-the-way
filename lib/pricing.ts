// Pricing logic for On the Way emergency charging

export const BASE_PRICE_CENTS        = 10000; // $100.00
export const BASE_MILES              = 15;
export const EXTRA_PER_10_MILES      = 5000;  // $50.00
export const RUSH_HOUR_PREMIUM       = 10000; // $100.00
export const BUFFER_MINUTES          = 20;
export const DEPOSIT_PERCENT         = 0.10;
export const RANGE_FREE_MILES        = 5;     // first 5 miles to Supercharger free
export const RANGE_ADDER_PER_5_MILES = 2000;  // +$20 per 5 miles above 5
export const MAX_SUPERCHARGER_MILES  = 20;    // beyond this we can't help

/** Extra fee based on driving miles from customer to nearest Supercharger */
export function calculateRangeFee(superchargerMiles: number): number {
  if (superchargerMiles <= RANGE_FREE_MILES) return 0;
  const billable = superchargerMiles - RANGE_FREE_MILES;
  return Math.ceil(billable / 5) * RANGE_ADDER_PER_5_MILES;
}

/** Returns total price in cents based on distance and time */
export function calculatePriceCents(distanceMiles: number, now: Date = new Date()): number {
  let price = BASE_PRICE_CENTS;

  if (distanceMiles > BASE_MILES) {
    const extraMiles = distanceMiles - BASE_MILES;
    const extraBands = Math.ceil(extraMiles / 10);
    price += extraBands * EXTRA_PER_10_MILES;
  }

  if (checkRushHour(now)) {
    price += RUSH_HOUR_PREMIUM;
  }

  return price;
}

/** True if current time is 7–9 AM or 4–6 PM Eastern */
export function checkRushHour(date: Date = new Date()): boolean {
  const etDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const h = etDate.getHours();
  return (h >= 7 && h < 9) || (h >= 16 && h < 18);
}

/** 10% deposit in cents */
export function depositCents(totalCents: number): number {
  return Math.round(totalCents * DEPOSIT_PERCENT);
}

/** Format cents as USD string e.g. "$150.00" */
export function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** Build a human-readable price breakdown */
export function priceBreakdown(
  distanceMiles: number,
  now: Date = new Date(),
  superchargerMiles: number = 0,
) {
  const rush = checkRushHour(now);
  const base = BASE_PRICE_CENTS;
  let extra = 0;
  if (distanceMiles > BASE_MILES) {
    const bands = Math.ceil((distanceMiles - BASE_MILES) / 10);
    extra = bands * EXTRA_PER_10_MILES;
  }
  const rushFee  = rush ? RUSH_HOUR_PREMIUM : 0;
  const rangeFee = calculateRangeFee(superchargerMiles);
  const total    = base + extra + rushFee + rangeFee;
  const deposit  = depositCents(total);

  return {
    base,
    extra,
    rushFee,
    rangeFee,
    total,
    deposit,
    remaining: total - deposit,
    isRushHour: rush,
  };
}
