import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    priceId: null,
    price: 0,
    remindersPerMonth: 5,
    apiCallsPerDay: 10,
    features: ["5 reminders/month", "10 API calls/day", "Basic support"],
  },
  pro: {
    name: "Pro",
    priceId: "price_1SqT3vDVD6OVaT2JvBKh0ewg",
    price: 999,
    remindersPerMonth: -1,
    apiCallsPerDay: 100,
    features: ["Unlimited reminders", "100 API calls/day", "Priority support"],
  },
  enterprise: {
    name: "Enterprise",
    priceId: "price_1SqT3wDVD6OVaT2Jf08FyEzc",
    price: 2999,
    remindersPerMonth: -1,
    apiCallsPerDay: -1,
    features: ["Unlimited reminders", "Unlimited API calls", "Team features", "API access", "24/7 support"],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export function getTierLimits(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.free;
}
