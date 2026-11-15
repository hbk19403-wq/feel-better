// India subscription tiers. All prices in INR (₹). The base experience stays
// pay-as-you-go at ₹1/min; subscriptions bundle included minutes + perks on top.
export interface Plan {
  id: string;
  name: string;
  price_inr: number;          // monthly price in whole rupees
  included_minutes: number;   // advisory minutes bundled each month (0 = none)
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price_inr: 0,
    included_minutes: 0,
    tagline: 'Pay as you go',
    features: [
      '15 min free venting every day',
      'Then just ₹1/min for advisory',
      'Community & The Vent Line access',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price_inr: 199,
    included_minutes: 300,
    tagline: 'For regular check-ins',
    features: [
      '300 advisory minutes / month included',
      'Then ₹1/min — no surprises',
      'Unlimited free venting',
      'Priority listener matching',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price_inr: 499,
    included_minutes: 900,
    tagline: 'Most popular',
    highlight: true,
    features: [
      '900 advisory minutes / month included',
      'Then ₹1/min',
      'Unlimited free venting',
      'Priority matching + saved listeners',
      '10% off verified therapist sessions',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price_inr: 999,
    included_minutes: 2500,
    tagline: 'For continuous support',
    features: [
      '2,500 advisory minutes / month included',
      'Then ₹1/min',
      'Unlimited free venting',
      'Top-priority matching',
      '20% off verified therapist sessions',
      'Monthly wellness check-in',
    ],
  },
];

export const PAYABLE_PLAN_IDS = PLANS.filter(p => p.price_inr > 0).map(p => p.id);

export function getPlan(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}

// The merchant UPI ID (VPA) that collects payments, and the display name shown
// in the payer's UPI app. Override via env in production if needed.
export const MERCHANT_VPA = process.env.UPI_PAYEE_VPA || '7661801407@ybl';
export const MERCHANT_NAME = process.env.UPI_PAYEE_NAME || '1800 FeelBetter';
