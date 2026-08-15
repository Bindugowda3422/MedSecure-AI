import "server-only";

/**
 * Medicine information assistant. Answers ONLY from the verified medicine
 * record passed in as context — never from general model knowledge — and
 * refuses diagnosis/prescription/dosage-change requests.
 *
 * Uses Gemini by default (AI_PROVIDER=gemini). The API key is read from
 * process.env.AI_API_KEY and never sent to the client.
 */

export interface VerifiedMedicineContext {
  medicineId: string;
  name: string;
  composition: string;
  dosage: string | null;
  uses: string | null;
  sideEffects: string | null;
  prescriptionRequired: boolean;
  manufacturer: string;
  batchNumber: string;
  expiryDate: string | null;
  verificationStatus: "VERIFIED" | "FAILED" | "UNKNOWN";
}

const SYSTEM_PROMPT = `You are a medicine information assistant.

Only answer using the verified medicine information provided by the application below.

If the required information is unavailable, say that it is unavailable.

Never invent medical information.

Do not diagnose or prescribe.

Do not recommend changing dosage or treatment.

Always remind users that medical decisions should be made with a qualified healthcare professional when the question concerns their personal health situation.

If the medicine's verification status is not VERIFIED, you must clearly warn the user that this record could not be verified against the blockchain-registered record, and you should still avoid inventing details.`;

function buildContextBlock(ctx: VerifiedMedicineContext): string {
  return [
    `Verification status: ${ctx.verificationStatus}`,
    `Medicine ID: ${ctx.medicineId}`,
    `Name: ${ctx.name}`,
    `Composition: ${ctx.composition}`,
    `Dosage: ${ctx.dosage ?? "Not provided"}`,
    `Uses: ${ctx.uses ?? "Not provided"}`,
    `Side effects: ${ctx.sideEffects ?? "Not provided"}`,
    `Prescription required: ${ctx.prescriptionRequired ? "Yes" : "No"}`,
    `Manufacturer: ${ctx.manufacturer}`,
    `Batch number: ${ctx.batchNumber}`,
    `Expiry date: ${ctx.expiryDate ?? "Not provided"}`,
  ].join("\n");
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askAssistant(
  ctx: VerifiedMedicineContext,
  history: AssistantMessage[],
  question: string
): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER || "gemini";

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const contextBlock = buildContextBlock(ctx);
  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\n--- VERIFIED MEDICINE CONTEXT ---\n${contextBlock}\n--- END CONTEXT ---`;

  if (provider === "gemini") {
    return askGemini(apiKey, fullSystemPrompt, history, question);
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

async function askGemini(
  apiKey: string,
  systemPrompt: string,
  history: AssistantMessage[],
  question: string
): Promise<string> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const contents = [
    ...history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: question }] },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini API returned no text content");
  }
  return text;
}
