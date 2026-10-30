import { z } from "zod";
import { diffDays, isValidIsoDate, todayIso } from "./dates";

export const MAX_RENTAL_DAYS = 30;
export const MAX_ADVANCE_DAYS = 180;

const isoDate = z
  .string()
  .refine(isValidIsoDate, { message: "Enter a valid date." });

export const contactFields = {
  customerName: z
    .string()
    .trim()
    .min(2, { message: "Enter your full name." })
    .max(80, { message: "That name is too long." }),
  customerEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Enter a valid email address." }))
    .pipe(z.string().max(160)),
  customerPhone: z
    .string()
    .trim()
    .refine((value) => /^\+?[0-9][0-9\s().-]{6,19}$/.test(value), {
      message: "Enter a valid phone number.",
    }),
};

export const bookingSchema = z
  .object({
    vanSlug: z.string().trim().min(1),
    pickupDate: isoDate,
    returnDate: isoDate,
    ...contactFields,
  })
  .superRefine((value, ctx) => {
    const days = diffDays(value.pickupDate, value.returnDate);
    const today = todayIso();

    if (days <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["returnDate"],
        message: "Return date must be after the pickup date.",
      });
    } else if (days > MAX_RENTAL_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["returnDate"],
        message: `Rentals are limited to ${MAX_RENTAL_DAYS} days.`,
      });
    }

    if (value.pickupDate < today) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupDate"],
        message: "Pickup cannot be in the past.",
      });
    } else if (diffDays(today, value.pickupDate) > MAX_ADVANCE_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["pickupDate"],
        message: `Bookings open ${MAX_ADVANCE_DAYS} days ahead.`,
      });
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1, { message: "Enter the admin password." }),
});

export const referenceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^RV-[A-Z0-9]{6}$/, { message: "Enter a reference like RV-4K7M2Q." });

export type ContactFields = Pick<
  BookingInput,
  "customerName" | "customerEmail" | "customerPhone"
>;
