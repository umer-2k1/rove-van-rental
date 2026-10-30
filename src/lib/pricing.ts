/**
 * Pricing is computed once, at booking time, and stored on the reservation.
 * Historical reservations therefore never change when a van's rate changes.
 */
export const CURRENCY = "USD";

export type PricingRule = {
  dailyRateCents: number;
  cleaningFeeCents: number;
};

export type Quote = {
  days: number;
  dailyRateCents: number;
  cleaningFeeCents: number;
  totalCents: number;
};

export function quoteFor(rule: PricingRule, days: number): Quote {
  const nights = Math.max(0, days);
  return {
    days: nights,
    dailyRateCents: rule.dailyRateCents,
    cleaningFeeCents: rule.cleaningFeeCents,
    totalCents: nights * rule.dailyRateCents + rule.cleaningFeeCents,
  };
}

export function formatMoney(cents: number): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: CURRENCY,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
