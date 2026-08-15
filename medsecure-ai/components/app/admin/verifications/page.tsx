import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const resultTone: Record<string, "green" | "red" | "amber"> = {
  VERIFIED: "green",
  FAILED: "red",
  UNKNOWN: "amber",
};

export default async function AdminVerificationsPage() {
  const supabase = createSupabaseServerClient();
  const { data: logs } = await supabase
    .from("verification_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(200);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Verification History</h1>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Medicine ID</th>
              <th className="p-3">Result</th>
              <th className="p-3">Database Hash</th>
              <th className="p-3">Blockchain Hash</th>
              <th className="p-3">Blockchain Status</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(logs ?? []).map((log: any) => (
              <tr key={log.id}>
                <td className="p-3 font-mono text-xs">{log.medicine_id}</td>
                <td className="p-3"><Badge tone={resultTone[log.verification_result] || "slate"}>{log.verification_result}</Badge></td>
                <td className="p-3 font-mono text-xs">{log.database_hash ? `${log.database_hash.slice(0, 12)}...` : "—"}</td>
                <td className="p-3 font-mono text-xs">{log.blockchain_hash ? `${log.blockchain_hash.slice(0, 12)}...` : "—"}</td>
                <td className="p-3">{log.blockchain_status || "—"}</td>
                <td className="p-3 text-slate-500">{formatDate(log.timestamp)}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">No verification attempts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
