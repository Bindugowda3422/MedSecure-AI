/**
 * Deterministic medicine hashing.
 *
 * The same medicine data must ALWAYS produce the same hash, and any change
 * to the canonical fields must change the hash. This hash is what gets
 * written to the blockchain and re-derived at verification time.
 */
import { createHash } from "crypto";

export interface CanonicalMedicineInput {
  medicineId: string;
  batchNumber: string;
  manufacturer: string;
  name: string;
  composition: string;
  expiryDate: string | null; // ISO date string (YYYY-MM-DD) or null
}

/** Normalize a value: trim, collapse whitespace, lowercase. */
function normalize(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Build the canonical string representation of a medicine record.
 * Field order is fixed and must never change without a migration plan,
 * since it changes every previously-issued hash.
 */
export function canonicalMedicineString(input: CanonicalMedicineInput): string {
  const canonical = {
    medicine_id: normalize(input.medicineId),
    batch_number: normalize(input.batchNumber),
    manufacturer: normalize(input.manufacturer),
    name: normalize(input.name),
    composition: normalize(input.composition),
    expiry_date: normalize(input.expiryDate),
  };
  // Stable key order (object above is already declared in fixed order).
  return JSON.stringify(canonical);
}

/** SHA-256 hash of the canonical medicine string, hex-encoded with 0x prefix
 *  (0x-prefixed 32-byte hex is what the Solidity contract expects as bytes32). */
export function hashMedicine(input: CanonicalMedicineInput): string {
  const canonical = canonicalMedicineString(input);
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
  return `0x${digest}`;
}

/** Compare two hashes safely (case-insensitive, since hex casing can vary
 *  between JS and on-chain bytes32 representations). */
export function hashesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}
