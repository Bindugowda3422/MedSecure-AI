import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { hashMedicine, hashesMatch } from "@/lib/hashing/hash";
import { getOnChainRecord, isBlockchainConfigured } from "@/lib/blockchain/contract";

export interface VerifyResponse {
  result: "VERIFIED" | "FAILED" | "UNKNOWN";
  medicine: Record<string, unknown> | null;
  databaseHash: string | null;
  blockchainHash: string | null;
  blockchainStatus: string | null;
  blockchainTxHash: string | null;
  message: string;
}

/**
 * GET /api/verify/[medicineId]
 *
 * Step 1: look up the medicine in Supabase.
 * Step 2: recompute the hash from the CURRENT database record.
 * Step 3: fetch the ORIGINAL hash from the blockchain.
 * Step 4: compare. Log every attempt in verification_logs.
 */
export async function GET(_req: NextRequest, { params }: { params: { medicineId: string } }) {
  const medicineId = decodeURIComponent(params.medicineId || "").trim();
  const db = createSupabaseServiceClient();

  if (!medicineId) {
    return NextResponse.json({ error: "Missing medicine ID" }, { status: 400 });
  }

  const { data: medicine, error } = await db
    .from("medicines")
    .select("*")
    .eq("medicine_id", medicineId)
    .maybeSingle();

  if (error) {
    console.error("[verify] db error", error);
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // ---- UNKNOWN: no such record ----
  if (!medicine) {
    await logAttempt(db, medicineId, "UNKNOWN", null, null, null);
    const body: VerifyResponse = {
      result: "UNKNOWN",
      medicine: null,
      databaseHash: null,
      blockchainHash: null,
      blockchainStatus: null,
      blockchainTxHash: null,
      message: "No registered medicine record was found for this ID.",
    };
    return NextResponse.json(body);
  }

  // Step 2: recompute hash from the current DB record
  const currentHash = hashMedicine({
    medicineId: medicine.medicine_id,
    batchNumber: medicine.batch_number,
    manufacturer: medicine.manufacturer,
    name: medicine.name,
    composition: medicine.composition,
    expiryDate: medicine.expiry_date,
  });

  // Also persist the freshly computed hash so medicine_hash always reflects "current" data
  if (currentHash !== medicine.medicine_hash) {
    await db.from("medicines").update({ medicine_hash: currentHash }).eq("id", medicine.id);
  }

  // Step 3: fetch original hash from blockchain
  if (!isBlockchainConfigured()) {
    await logAttempt(db, medicineId, "UNKNOWN", currentHash, null, medicine.blockchain_status);
    const body: VerifyResponse = {
      result: "UNKNOWN",
      medicine,
      databaseHash: currentHash,
      blockchainHash: null,
      blockchainStatus: medicine.blockchain_status,
      blockchainTxHash: medicine.blockchain_tx_hash,
      message: "Blockchain is not configured on this server, so the record cannot be cryptographically verified.",
    };
    return NextResponse.json(body);
  }

  let onChainHash: string | null = null;
  let found = false;
  try {
    const record = await getOnChainRecord(medicineId);
    found = record.found;
    onChainHash = record.medicineHash;
  } catch (chainError) {
    console.error("[verify] blockchain error", chainError);
    await logAttempt(db, medicineId, "UNKNOWN", currentHash, null, "UNAVAILABLE");
    const body: VerifyResponse = {
      result: "UNKNOWN",
      medicine,
      databaseHash: currentHash,
      blockchainHash: null,
      blockchainStatus: "UNAVAILABLE",
      blockchainTxHash: medicine.blockchain_tx_hash,
      message: "Blockchain network is currently unreachable. Could not verify this record right now.",
    };
    return NextResponse.json(body, { status: 200 });
  }

  if (!found) {
    await logAttempt(db, medicineId, "UNKNOWN", currentHash, null, "NOT_ON_CHAIN");
    const body: VerifyResponse = {
      result: "UNKNOWN",
      medicine,
      databaseHash: currentHash,
      blockchainHash: null,
      blockchainStatus: "NOT_ON_CHAIN",
      blockchainTxHash: medicine.blockchain_tx_hash,
      message: "This medicine exists in the database but has no matching blockchain record.",
    };
    return NextResponse.json(body);
  }

  // Step 4: compare
  const matched = hashesMatch(currentHash, onChainHash);
  const result: VerifyResponse["result"] = matched ? "VERIFIED" : "FAILED";

  await logAttempt(db, medicineId, result, currentHash, onChainHash, medicine.blockchain_status);

  const body: VerifyResponse = {
    result,
    medicine,
    databaseHash: currentHash,
    blockchainHash: onChainHash,
    blockchainStatus: medicine.blockchain_status,
    blockchainTxHash: medicine.blockchain_tx_hash,
    message: matched
      ? "Medicine record matches the blockchain record."
      : "The current medicine information does not match the blockchain-registered record. Possible tampering detected.",
  };
  return NextResponse.json(body);
}

async function logAttempt(
  db: ReturnType<typeof createSupabaseServiceClient>,
  medicineId: string,
  result: "VERIFIED" | "FAILED" | "UNKNOWN",
  databaseHash: string | null,
  blockchainHash: string | null,
  blockchainStatus: string | null
) {
  try {
    await db.from("verification_logs").insert({
      medicine_id: medicineId,
      verification_result: result,
      database_hash: databaseHash,
      blockchain_hash: blockchainHash,
      blockchain_status: blockchainStatus,
    });
  } catch (e) {
    console.error("[verify] failed to write verification log", e);
  }
}
