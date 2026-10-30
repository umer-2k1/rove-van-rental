import { randomInt } from "node:crypto";

/** No I, O, 0 or 1 — a reference gets read out over the phone. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReference(): string {
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `RV-${suffix}`;
}

export function generateUnlockCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function normalizeReference(value: string): string {
  return value.trim().toUpperCase();
}
