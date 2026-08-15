"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";
import { toast } from "sonner";

/** One-click demo: mutates the composition field of a DEMO medicine so the
 *  next verification will fail hash comparison — proving tamper detection. */
export function TamperDemoButton({ medicineId }: { medicineId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleTamper() {
    if (!confirm(`Simulate tampering on ${medicineId}? This changes the demo database record only.`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/demo/tamper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId,
          field: "composition",
          value: "TAMPERED — Unverified composition (demo)",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to simulate tampering");
        return;
      }
      toast.success("Demo tamper applied — verify this medicine again to see VERIFICATION FAILED");
      router.push(`/verify/${encodeURIComponent(medicineId)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" onClick={handleTamper} disabled={loading}>
      <FlaskConical className="h-3.5 w-3.5" /> Simulate Tamper
    </Button>
  );
}
