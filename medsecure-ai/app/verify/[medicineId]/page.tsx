import Link from "next/link";
import { VerificationStatusBanner, type VerificationResult } from "@/components/verification-status";
import { MedicineCard } from "@/components/medicine-card";
import { BlockchainStatusBadge, TxHashLink } from "@/components/blockchain-status";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { truncateHash } from "@/lib/utils";
import { headers } from "next/headers";
import { MessageCircle } from "lucide-react";

async function getBaseUrl() {
  const h = headers();
  const host = h.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
}

export default async function VerifyPage({ params }: { params: { medicineId: string } }) {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/verify/${encodeURIComponent(params.medicineId)}`, {
    cache: "no-store",
  });
  const data = await res.json();

  const result: VerificationResult = data.result || "UNKNOWN";

  return (
    <div className="container-page py-12 max-w-2xl space-y-6">
      <VerificationStatusBanner result={result} message={data.message} />

      {data.medicine && (
        <>
          <MedicineCard medicine={data.medicine} />

          <Card>
            <CardContent className="space-y-3">
              <h3 className="font-semibold text-slate-900">Blockchain Verification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase text-slate-400">Blockchain Status</dt>
                  <dd className="mt-1"><BlockchainStatusBadge status={data.blockchainStatus} /></dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Transaction Hash</dt>
                  <dd className="mt-1"><TxHashLink txHash={data.medicine.blockchain_tx_hash} /></dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Database Hash</dt>
                  <dd className="mt-1"><code className="text-xs">{truncateHash(data.databaseHash)}</code></dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Blockchain Hash</dt>
                  <dd className="mt-1"><code className="text-xs">{truncateHash(data.blockchainHash)}</code></dd>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href={`/assistant?medicineId=${encodeURIComponent(params.medicineId)}`}>
            <Button className="w-full" size="lg">
              <MessageCircle className="h-5 w-5" /> Ask MedSecure AI about this medicine
            </Button>
          </Link>
        </>
      )}

      {!data.medicine && (
        <p className="text-sm text-slate-500">
          Double-check the ID, or{" "}
          <Link href="/scan" className="text-brand-600 underline">
            scan again
          </Link>
          .
        </p>
      )}
    </div>
  );
}
