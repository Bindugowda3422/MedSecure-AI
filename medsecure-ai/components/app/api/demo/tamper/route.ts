import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient, requireAdmin } from "@/lib/supabase/server";

const schema = z.object({
  medicineId: z.string().trim().min(1),
  // Which demo field to mutate, and its new (tampered) value.
  field: z.enum(["composition", "name", "manufacturer", "batch_number"]),
  value: z.string().trim().min(1).max(500),
});

/**
 * POST /api/demo/tamper — admin-only.
 *
 * Intentionally changes a DEMO medicine's database field WITHOUT touching
 * the blockchain, so the next /verify call will recompute a different hash
 * than what's on-chain and surface "VERIFICATION FAILED". This is the
 * controlled tampering demonstration described in the brief.
 *
 * Refuses to run on any record where is_demo = false, so real production
 * records can never be tampered with via this endpoint.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { medicineId, field, value } = parsed.data;

  const db = createSupabaseServiceClient();
  const { data: medicine } = await db
    .from("medicines")
    .select("id, is_demo")
    .eq("medicine_id", medicineId)
    .maybeSingle();

  if (!medicine) {
    return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
  }
  if (!medicine.is_demo) {
    return NextResponse.json(
      { error: "Refusing to tamper with a non-demo record." },
      { status: 403 }
    );
  }

  const { error } = await db.from("medicines").update({ [field]: value }).eq("id", medicine.id);
  if (error) {
    return NextResponse.json({ error: "Failed to apply demo tamper" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    note: "Database record modified. The blockchain-registered hash was NOT changed. Re-run /verify/[medicineId] to see VERIFICATION FAILED.",
  });
}
