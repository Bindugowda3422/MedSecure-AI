import { QrScanner } from "@/components/qr-scanner";

export default function ScanPage() {
  return (
    <div className="container-page py-12 max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Scan Medicine</h1>
      <p className="mt-1 text-sm text-slate-500">
        Point your camera at the QR code on the medicine strip, or enter its ID manually.
      </p>
      <div className="mt-8">
        <QrScanner />
      </div>
    </div>
  );
}
