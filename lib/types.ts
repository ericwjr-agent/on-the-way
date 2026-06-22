export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  isHighway: boolean;
}

export interface QuoteData {
  distanceMiles: number;
  drivingMinutes: number;    // from Google Maps
  etaMinutes: number;        // drivingMinutes + 20 buffer
  priceCents: number;
  depositCents: number;
  remainingCents: number;
  isRushHour: boolean;
  breakdown: {
    base: number;
    extra: number;
    rushFee: number;
  };
}

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface BookingPayload {
  location: LocationData;
  quote: QuoteData;
  contact: ContactInfo;
  paypalOrderId: string;
  depositPaid: number;
  bookedAt: string;
}

export type BookingStep = 'location' | 'quote' | 'contact' | 'payment' | 'confirmed';
