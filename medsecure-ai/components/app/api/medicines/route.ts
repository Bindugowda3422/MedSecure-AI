import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient, createSupabaseServiceClient, requireAdmin } from "@/lib/supabase/server";
import { hashMedicine } from "@/lib/hashing/hash";
import { generateMedicineId } from "@/lib/utils";
import { isBlockchainConfigured, registerMedicineOnChain } from "@/lib/blockchain/contract";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  composition: z.string().trim().min(2).max(500),
  dosage: z.string().trim().max(200).optional().nullable(),
  uses: z.string().trim().max(2000).optional().nullable(),
  sideEffects: z.string().trim().max(2000).optional().nullable(),
  prescriptionRequired: z.boolean().default(false),
  manufacturer: z.string().trim().min(2).max(200),
  batchNumber: z.string().trim().min(1).max(100),
  manufacturingDate: z.string().trim().optional().nullable(),
  expiryDate: z.string().trim().optional().nullable(),
});

/**
 * POST /api/medicines — admin-only medicine registration.
 * Pipeline: validate -> generate medicine_id -> hash -> save (PENDING) ->
 * register on-chain -> update with tx hash + REGISTERED/FAILED status.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Not authorized. Admin login required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const db = createSupabaseServiceClient();

    // Generate a sequential public medicine ID, e.g. MED-IND-2026-000001
    const year = new Date().getFullYear();
    const { count } = await db
      .from("medicines")
      .select("id", { count: "exact", head: true })
      .like("medicine_id", `MED-IND-${year}-%`);
    const medicineId = generateMedicineId((count ?? 0) + 1, year);

    const medicineHash = hashMedicine({
      medicineId,
      batchNumber: input.batchNumber,
      manufacturer: input.manufacturer,
      name: input.name,
      composition: input.composition,
      expiryDate: input.expiryDate ?? null,
    });

    const { data: inserted, error: insertError } = await db
      .from("medicines")
      .insert({
        medicine_id: medicineId,
        name: input.name,
        composition: input.composition,
        dosage: input.dosage ?? null,
        uses: input.uses ?? null,
        side_effects: input.sideEffects ?? null,
        prescription_required: input.prescriptionRequired,
        manufacturer: input.manufacturer,
        batch_number: input.batchNumber,
        manufacturing_date: input.manufacturingDate || null,
        expiry_date: input.expiryDate || null,
        medicine_hash: medicineHash,
        blockchain_status: "PENDING",
        is_demo: true,
        created_by: admin.id,
      })
      .select()
      .single();

    if (insertError || !inserted) {
      return NextResponse.json({ error: "Failed to save medicine record" }, { status: 500 });
    }

    if (!isBlockchainConfigured()) {
      return NextResponse.json({
        medicine: inserted,
        blockchain: { status: "PENDING", note: "Blockchain not configured — see BLOCKCHAIN_* env vars." },
      });
    }

    try {
      const { txHash } = await registerMedicineOnChain(medicineId, input.batchNumber, medicineHash);
      const { data: updated } = await db
        .from("medicines")
        .update({ blockchain_tx_hash: txHash, blockchain_status: "REGISTERED" })
        .eq("id", inserted.id)
        .select()
        .single();

      return NextResponse.json({ medicine: updated ?? inserted, blockchain: { status: "REGISTERED", txHash } });
    } catch (chainError) {
      await db.from("medicines").update({ blockchain_status: "FAILED" }).eq("id", inserted.id);
      return NextResponse.json(
        {
          medicine: { ...inserted, blockchain_status: "FAILED" },
          blockchain: { status: "FAILED", error: "Blockchain registration failed. See server logs." },
        },
        { status: 207 }
      );
    }
  } catch (err) {
    console.error("[POST /api/medicines]", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

/** GET /api/medicines — admin-only list for the dashboard. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to load medicines" }, { status: 500 });
  }
  return NextResponse.json({ medicines: data });
}
