import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { askAssistant, type AssistantMessage } from "@/lib/ai/assistant";

const bodySchema = z.object({
  medicineId: z.string().trim().min(1),
  question: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .max(20)
    .optional()
    .default([]),
});

/**
 * POST /api/assistant
 * Body: { medicineId, question, history? }
 *
 * Loads the medicine's VERIFIED database record and re-derives its
 * verification status server-side (never trusts client-provided status),
 * then asks the AI using only that context.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { medicineId, question, history } = parsed.data;

    const db = createSupabaseServiceClient();
    const { data: medicine } = await db
      .from("medicines")
      .select("*")
      .eq("medicine_id", medicineId)
      .maybeSingle();

    if (!medicine) {
      return NextResponse.json(
        { answer: "This medicine ID is not in the registry, so I don't have any verified information to answer from." },
        { status: 200 }
      );
    }

    // Look at the most recent verification log for this medicine to decide status.
    const { data: lastLog } = await db
      .from("verification_logs")
      .select("verification_result")
      .eq("medicine_id", medicineId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    const verificationStatus = (lastLog?.verification_result as "VERIFIED" | "FAILED" | "UNKNOWN") || "UNKNOWN";

    const answer = await askAssistant(
      {
        medicineId: medicine.medicine_id,
        name: medicine.name,
        composition: medicine.composition,
        dosage: medicine.dosage,
        uses: medicine.uses,
        sideEffects: medicine.side_effects,
        prescriptionRequired: medicine.prescription_required,
        manufacturer: medicine.manufacturer,
        batchNumber: medicine.batch_number,
        expiryDate: medicine.expiry_date,
        verificationStatus,
      },
      history as AssistantMessage[],
      question
    );

    return NextResponse.json({ answer, verificationStatus });
  } catch (err) {
    console.error("[POST /api/assistant]", err);
    return NextResponse.json(
      { error: "The AI assistant is temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}
