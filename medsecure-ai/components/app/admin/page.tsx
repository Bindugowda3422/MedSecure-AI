import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageCheck } from "lucide-react";

async function getStats() {
  const supabase = createSupabaseServerClient();

  const [{ count: totalMedicines }, { data: logs }] = await Promise.all([
    supabase.from("medicines").select("id", { count: "exact", head: true }),
    supabase.from("verification_logs").select("verification_result, medicine_id, timestamp").order("timestamp", { ascending: false }).limit(10),
  ]);

  const { count: totalVerifications } = await supabase
    .from("verification_logs")
    .select("id", { count: "exact", head: true });
  const { count: verified } = await supabase
    .from("verification_logs")
    .select("id", { count: "exact", head: true })
    .eq("verification_result", "VERIFIED");
  const { count: failed } = await supabase
    .from("verification_logs")
    .select("id", { count: "exact", head: true })
    .eq("verification_result", "FAILED");
  const { count: unknown } = await supabase
    .from("verification_logs")
    .select("id", { count: "exact", head: true })
    .eq("verification_result", "UNKNOWN");

  return {
    totalMedicines: totalMedicines ?? 0,
    totalVerifications: totalVerifications ?? 0,
    verified: verified ?? 0,
    failed: failed ?? 0,
    unknown: unknown ?? 0,
    recent: logs ?? [],
  };
}

const resultTone: Record<string, "green" | "red" | "amber"> = {
  VERIFIED: "green",
  FAILED: "red",
  UNKNOWN: "amber",
};

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="container-page py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/register">
            <Button><PlusCircle className="h-4 w-4" /> Register Medicine</Button>
          </Link>
          <Link href="/admin/medicines">
            <Button variant="outline"><PackageCheck className="h-4 w-4" /> View Medicines</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Stat label="Total Medicines" value={stats.totalMedicines} />
        <Stat label="Total Verifications" value={stats.totalVerifications} />
        <Stat label="Successful" value={stats.verified} tone="green" />
        <Stat label="Failed" value={stats.failed} tone="red" />
        <Stat label="Unknown" value={stats.unknown} tone="amber" />
      </div>

      <Card>
        <CardContent>
          <h2 className="font-semibold text-slate-900 mb-4">Recent Verification Activity</h2>
          {stats.recent.length === 0 && <p className="text-sm text-slate-400">No verification attempts yet.</p>}
          <ul className="divide-y divide-slate-100">
            {stats.recent.map((log: any, i: number) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="font-mono text-slate-700">{log.medicine_id}</span>
                <Badge tone={resultTone[log.verification_result] || "slate"}>{log.verification_result}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DemoPanel />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "green" | "red" | "amber" }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${tone === "red" ? "text-red-600" : tone === "green" ? "text-emerald-600" : tone === "amber" ? "text-amber-600" : "text-slate-900"}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function DemoPanel() {
  return (
    <Card>
      <CardContent className="space-y-2">
        <h2 className="font-semibold text-slate-900">Demo Mode</h2>
        <p className="text-sm text-slate-500">
          Seed sample medicines, then use the tampering demo to show blockchain tamper-detection live. See{" "}
          <Link href="/admin/medicines" className="text-brand-600 underline">
            Medicines
          </Link>{" "}
          for per-record demo actions, or POST to <code className="text-xs bg-slate-100 px-1 rounded">/api/demo/seed</code> to load sample data.
        </p>
      </CardContent>
    </Card>
  );
}
