import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerificationResult = "VERIFIED" | "FAILED" | "UNKNOWN";

const config: Record<
  VerificationResult,
  { label: string; sub: string; icon: typeof CheckCircle2; classes: string }
> = {
  VERIFIED: {
    label: "VERIFIED MEDICINE",
    sub: "Medicine record matches the blockchain record.",
    icon: CheckCircle2,
    classes: "bg-emerald-50 border-emerald-300 text-emerald-800",
  },
  FAILED: {
    label: "VERIFICATION FAILED",
    sub: "The current medicine information does not match the blockchain-registered record. Possible tampering detected.",
    icon: AlertTriangle,
    classes: "bg-red-50 border-red-300 text-red-800",
  },
  UNKNOWN: {
    label: "UNKNOWN MEDICINE",
    sub: "No registered medicine record was found, or it could not be verified.",
    icon: HelpCircle,
    classes: "bg-amber-50 border-amber-300 text-amber-800",
  },
};

export function VerificationStatusBanner({
  result,
  message,
}: {
  result: VerificationResult;
  message?: string;
}) {
  const c = config[result];
  const Icon = c.icon;
  return (
    <div className={cn("flex items-start gap-4 rounded-xl border-2 p-6", c.classes)}>
      <Icon className="h-9 w-9 shrink-0" />
      <div>
        <p className="text-xl font-bold tracking-tight">{c.label}</p>
        <p className="mt-1 text-sm">{message || c.sub}</p>
      </div>
    </div>
  );
}
