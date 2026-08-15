import { redirect } from "next/navigation";

/** The verify page already shows full medicine info once verified, so this
 *  route simply forwards there to keep a single source of truth. */
export default function MedicineRedirectPage({ params }: { params: { medicineId: string } }) {
  redirect(`/verify/${encodeURIComponent(params.medicineId)}`);
}
