import { describe, it, expect } from "vitest";
import { hashMedicine, hashesMatch, canonicalMedicineString } from "@/lib/hashing/hash";

const base = {
  medicineId: "MED-IND-2026-000001",
  batchNumber: "MED2026A001",
  manufacturer: "Demo Pharma Pvt. Ltd.",
  name: "Paracetamol 500 mg",
  composition: "Paracetamol 500 mg",
  expiryDate: "2027-12-31",
};

describe("hashMedicine", () => {
  it("is deterministic for identical input", () => {
    expect(hashMedicine(base)).toBe(hashMedicine({ ...base }));
  });

  it("is insensitive to whitespace/case differences (normalization)", () => {
    const variant = { ...base, name: "  paracetamol   500 MG " };
    expect(hashMedicine(base)).toBe(hashMedicine(variant));
  });

  it("changes when any canonical field changes", () => {
    const tampered = { ...base, composition: "Paracetamol 650 mg" };
    expect(hashMedicine(base)).not.toBe(hashMedicine(tampered));
  });

  it("produces a 0x-prefixed 32-byte hex string", () => {
    const hash = hashMedicine(base);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("hashesMatch", () => {
  it("matches case-insensitively", () => {
    const a = hashMedicine(base);
    expect(hashesMatch(a, a.toUpperCase())).toBe(true);
  });

  it("returns false for null/undefined", () => {
    expect(hashesMatch(null, "0xabc")).toBe(false);
    expect(hashesMatch("0xabc", undefined)).toBe(false);
  });
});

describe("canonicalMedicineString", () => {
  it("has a stable field order", () => {
    const str = canonicalMedicineString(base);
    const keys = Object.keys(JSON.parse(str));
    expect(keys).toEqual([
      "medicine_id",
      "batch_number",
      "manufacturer",
      "name",
      "composition",
      "expiry_date",
    ]);
  });
});
