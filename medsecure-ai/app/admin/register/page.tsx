"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { QrGenerator } from "@/components/qr-generator";
import { verificationUrlFor } from "@/lib/utils";
import { BlockchainStatusBadge, TxHashLink } from "@/components/blockchain-status";
import { CheckCircle2 } from "lucide-react";

const initialForm = {
  name: "",
  composition: "",
  dosage: "",
  uses: "",
  sideEffects: "",
  prescriptionRequired: false,
  manufacturer: "",
  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",
};

export default function RegisterMedicinePage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  function update<K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 207) {
        toast.error(data.error || "Registration failed");
        return;
      }
      setResult(data);
      toast.success("Medicine registered");
      setForm(initialForm);
    } catch {
      toast.error("Unexpected error while registering medicine");
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    const medicineId = result.medicine.medicine_id;
    return (
      <div className="container-page py-12 max-w-lg space-y-6">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" />
          <h1 className="text-xl font-bold">Medicine Registered</h1>
        </div>
        <Card>
          <CardContent className="space-y-3 text-sm">
            <Row label="Medicine ID" value={medicineId} mono />
            <Row label="Blockchain" value={<BlockchainStatusBadge status={result.blockchain?.status} />} />
            <Row label="Transaction" value={<TxHashLink txHash={result.blockchain?.txHash} />} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="font-semibold text-slate-900 mb-4 text-center">QR Code</h2>
            <QrGenerator medicineId={medicineId} verificationUrl={verificationUrlFor(medicineId)} />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setResult(null)}>Register Another</Button>
          <Button onClick={() => router.push("/admin/medicines")}>View All Medicines</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Register Medicine</h1>
      <p className="mt-1 text-sm text-slate-500">
        Creates a medicine record, generates its unique ID, hashes it, and registers the hash on-chain.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <TextField label="Medicine Name" value={form.name} onChange={(v) => update("name", v)} required placeholder="Paracetamol 500 mg" />
        <TextField label="Composition" value={form.composition} onChange={(v) => update("composition", v)} required placeholder="Paracetamol 500 mg" />
        <TextField label="Dosage" value={form.dosage} onChange={(v) => update("dosage", v)} placeholder="1 tablet every 4-6 hours" />
        <TextArea label="Uses" value={form.uses} onChange={(v) => update("uses", v)} />
        <TextArea label="Side Effects" value={form.sideEffects} onChange={(v) => update("sideEffects", v)} />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.prescriptionRequired}
            onChange={(e) => update("prescriptionRequired", e.target.checked)}
          />
          Prescription Required
        </label>

        <TextField label="Manufacturer" value={form.manufacturer} onChange={(v) => update("manufacturer", v)} required placeholder="Demo Pharma Pvt. Ltd." />
        <TextField label="Batch Number" value={form.batchNumber} onChange={(v) => update("batchNumber", v)} required placeholder="MED2026A001" />

        <div className="grid grid-cols-2 gap-4">
          <TextField label="Manufacturing Date" type="date" value={form.manufacturingDate} onChange={(v) => update("manufacturingDate", v)} />
          <TextField label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => update("expiryDate", v)} />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Registering..." : "Register Medicine"}
        </Button>
      </form>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={mono ? "font-mono" : ""}>{value}</dd>
    </div>
  );
}
