export type VanSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  dailyRateCents: number;
  cleaningFeeCents: number;
  seats: number;
  sleeps: number;
  transmission: string;
  fuel: string;
  drivetrain: string;
  imageUrl: string;
  imageAlt: string;
  imagePosition: string;
  features: string[];
};

export type VanDetail = VanSummary;
