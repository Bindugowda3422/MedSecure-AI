import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { BlockchainStatusBadge } from "@/components/blockchain-status";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, QrCode } from "lucide-react";
import { TamperDemoButton } from "./tamper-demo-button";
import { SeedDemoButton } from "./seed-demo-button";

export default async function AdminMedicinesPage() {
  const supabase = createSupabaseServerClient();
  const { data: medicines } = await supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Medicines</h1>
        <div className="flex gap-2">
          <SeedDemoButton />
          <Link href="/admin/register">
            <Button>Register New</Button>
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="p-3">Medicine</th>
              <th className="p-3">Medicine ID</th>
              <th className="p-3">Batch</th>
              <th className="p-3">Manufacturer</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Blockchain</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(medicines ?? []).map((m: any) => (
              <tr key={m.id}>
                <td className="p-3 font-medium text-slate-900">
                  {m.name} {m.is_demo && <Badge tone="slate" className="ml-2">demo</Badge>}
                </td>
                <td className="p-3 font-mono text-xs">{m.medicine_id}</td>
                <td className="p-3">{m.batch_number}</td>
                <td className="p-3">{m.manufacturer}</td>
                <td className="p-3">{formatDate(m.expiry_date)}</td>
                <td className="p-3"><BlockchainStatusBadge status={m.blockchain_status} /></td>
                <td className="p-3 text-slate-500">{formatDate(m.created_at)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/verify/${encodeURIComponent(m.medicine_id)}`}>
                      <Button size="sm" variant="outline"><Eye className="h-3.5 w-3.5" /> Verify</Button>
                    </Link>
                    <Link href={`/admin/register?prefillQr=${encodeURIComponent(m.medicine_id)}`}>
                      <Button size="sm" variant="ghost"><QrCode className="h-3.5 w-3.5" /> QR</Button>
                    </Link>
                    {m.is_demo && <TamperDemoButton medicineId={m.medicine_id} />}
                  </div>
                </td>
              </tr>
            ))}
            {(!medicines || medicines.length === 0) && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  No medicines registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
