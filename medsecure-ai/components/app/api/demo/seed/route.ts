import { NextResponse } from "next/server";
import { createSupabaseServiceClient, requireAdmin } from "@/lib/supabase/server";
import { hashMedicine } from "@/lib/hashing/hash";
import { generateMedicineId } from "@/lib/utils";
import { isBlockchainConfigured, registerMedicineOnChain } from "@/lib/blockchain/contract";

const DEMO_MEDICINES = [
  {
    name: "Paracetamol 500 mg",
    composition: "Paracetamol 500 mg",
    dosage: "1 tablet every 4-6 hours, max 4 tablets/24h",
    uses: "Fever, mild to moderate pain relief",
    sideEffects: "Nausea, rash (rare); overdose can cause serious liver damage",
    prescriptionRequired: false,
    manufacturer: "Demo Pharma Pvt. Ltd.",
    batchNumber: "MED2026A001",
  },
  {
    name: "Cetirizine 10 mg",
    composition: "Cetirizine Hydrochloride 10 mg",
    dosage: "1 tablet once daily",
    uses: "Allergic rhinitis, urticaria (allergy relief)",
    sideEffects: "Drowsiness, dry mouth, headache",
    prescriptionRequired: false,
    manufacturer: "Demo Pharma Pvt. Ltd.",
    batchNumber: "MED2026A002",
  },
  {
    name: "Omeprazole 20 mg",
    composition: "Omeprazole 20 mg",
    dosage: "1 capsule once daily before food",
    uses: "Acid reflux, gastric ulcers, GERD",
    sideEffects: "Headache, abdominal pain, nausea",
    prescriptionRequired: true,
    manufacturer: "Demo Pharma Pvt. Ltd.",
    batchNumber: "MED2026A003",
  },
  {
    name: "Azithromycin 500 mg",
    composition: "Azithromycin 500 mg",
    dosage: "1 tablet once daily for 3 days (as prescribed)",
    uses: "Bacterial infections (respiratory, skin, etc.)",
    sideEffects: "Diarrhea, nausea, abdominal pain",
    prescriptionRequired: true,
    manufacturer: "Demo Pharma Pvt. Ltd.",
    batchNumber: "MED2026A004",
  },
];

/**
 * POST /api/demo/seed — admin-only. Idempotent-ish: skips any demo medicine
 * whose batch_number already exists. Registers each through the REAL
 * pipeline (hash + on-chain registration) so the demo data behaves exactly
 * like admin-registered data.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const db = createSupabaseServiceClient();
  const year = new Date().getFullYear();
  const results: Array<Record<string, unknown>> = [];

  for (const demo of DEMO_MEDICINES) {
    const { data: existing } = await db
      .from("medicines")
      .select("medicine_id")
      .eq("batch_number", demo.batchNumber)
      .maybeSingle();

    if (existing) {
      results.push({ batch: demo.batchNumber, skipped: true, medicineId: existing.medicine_id });
      continue;
    }

    const { count } = await db
      .from("medicines")
      .select("id", { count: "exact", head: true })
      .like("medicine_id", `MED-IND-${year}-%`);
    const medicineId = generateMedicineId((count ?? 0) + 1, year);

    const medicineHash = hashMedicine({
      medicineId,
      batchNumber: demo.batchNumber,
      manufacturer: demo.manufacturer,
      name: demo.name,
      composition: demo.composition,
      expiryDate: null,
    });

    const { data: inserted } = await db
      .from("medicines")
      .insert({
        medicine_id: medicineId,
        name: demo.name,
        composition: demo.composition,
        dosage: demo.dosage,
        uses: demo.uses,
        side_effects: demo.sideEffects,
        prescription_required: demo.prescriptionRequired,
        manufacturer: demo.manufacturer,
        batch_number: demo.batchNumber,
        expiry_date: "2027-12-31",
        medicine_hash: medicineHash,
        blockchain_status: "PENDING",
        is_demo: true,
        created_by: admin.id,
      })
      .select()
      .single();

    let blockchainStatus = "PENDING";
    let txHash: string | null = null;

    if (inserted && isBlockchainConfigured()) {
      try {
        const reg = await registerMedicineOnChain(medicineId, demo.batchNumber, medicineHash);
        txHash = reg.txHash;
        blockchainStatus = "REGISTERED";
        await db
          .from("medicines")
          .update({ blockchain_tx_hash: txHash, blockchain_status: blockchainStatus })
          .eq("id", inserted.id);
      } catch (e) {
        blockchainStatus = "FAILED";
        await db.from("medicines").update({ blockchain_status: "FAILED" }).eq("id", inserted.id);
      }
    }

    results.push({ medicineId, batch: demo.batchNumber, blockchainStatus, txHash });
  }

  return NextResponse.json({ seeded: results });
}
