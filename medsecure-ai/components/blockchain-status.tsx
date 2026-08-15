import { Badge, type BadgeTone } from "@/components/ui/badge";
import { truncateHash } from "@/lib/utils";

const toneMap: Record<string, BadgeTone> = {
  REGISTERED: "green",
  PENDING: "amber",
  FAILED: "red",
  UNAVAILABLE: "slate",
  NOT_ON_CHAIN: "amber",
};

export function BlockchainStatusBadge({ status }: { status: string | null | undefined }) {
  const s = status || "PENDING";
  return <Badge tone={toneMap[s] || "slate"}>{s.replace(/_/g, " ")}</Badge>;
}

export function TxHashLink({ txHash }: { txHash: string | null | undefined }) {
  if (!txHash) return <span className="text-slate-400">—</span>;
  return (
    <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700" title={txHash}>
      {truncateHash(txHash)}
    </code>
  );
}
