export const site = {
  name: "Rove",
  tagline: "Van rental, done plainly.",
  email: "hello@rovevans.example",
  phone: "+1 (415) 555-0134",
  pickupAddress: "18 Foundry Lane, Oakland, CA",
  hours: "Pickup 08:00–18:00, every day",
} as const;

export const nav = [
  { href: "/#fleet", label: "Fleet" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/manage", label: "Manage booking" },
] as const;

export const policy = {
  minDays: 1,
  maxDays: 30,
  advanceDays: 180,
  cancellation: "Free cancellation up to 48 hours before pickup.",
  mileage: "300 miles per day included.",
  deposit: "A $500 refundable deposit is held at pickup.",
} as const;
