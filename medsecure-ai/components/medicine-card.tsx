import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export interface MedicineData {
  medicine_id: string;
  name: string;
  composition: string;
  dosage?: string | null;
  uses?: string | null;
  side_effects?: string | null;
  prescription_required: boolean;
  manufacturer: string;
  batch_number: string;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
}

export function MedicineCard({ medicine }: { medicine: MedicineData }) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{medicine.name}</h2>
            <p className="text-sm text-slate-500">{medicine.medicine_id}</p>
          </div>
          {medicine.prescription_required ? (
            <Badge tone="amber">Prescription Required</Badge>
          ) : (
            <Badge tone="green">OTC</Badge>
          )}
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <Field label="Composition" value={medicine.composition} />
          <Field label="Dosage" value={medicine.dosage} />
          <Field label="Manufacturer" value={medicine.manufacturer} />
          <Field label="Batch Number" value={medicine.batch_number} />
          <Field label="Manufacturing Date" value={formatDate(medicine.manufacturing_date)} />
          <Field label="Expiry Date" value={formatDate(medicine.expiry_date)} />
        </dl>

        {medicine.uses && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Uses</dt>
            <dd className="text-sm text-slate-700">{medicine.uses}</dd>
          </div>
        )}
        {medicine.side_effects && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Side Effects</dt>
            <dd className="text-sm text-slate-700">{medicine.side_effects}</dd>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value || "—"}</dd>
    </div>
  );
}
