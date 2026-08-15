import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generates a public medicine identifier like MED-IND-2026-000123.
 *  `sequence` should come from a DB count/sequence, not client input. */
export function generateMedicineId(sequence: number, year = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(6, "0");
  return `MED-IND-${year}-${padded}`;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function verificationUrlFor(medicineId: string): string {
  return `${getAppUrl()}/verify/${encodeURIComponent(medicineId)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function truncateHash(hash: string | null | undefined, chars = 10): string {
  if (!hash) return "—";
  if (hash.length <= chars * 2 + 3) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
