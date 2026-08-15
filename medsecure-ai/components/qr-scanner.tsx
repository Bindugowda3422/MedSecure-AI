"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Keyboard } from "lucide-react";

/**
 * Camera-based QR scanner using html5-qrcode. Falls back gracefully to
 * manual entry if the camera is unavailable/denied — required so the
 * app is still usable on desktop and when permissions fail.
 */
export function QrScanner() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");

  useEffect(() => {
    return () => {
      scannerRef.current?.stop?.().catch(() => {});
    };
  }, []);

  function extractMedicineId(text: string): string {
    try {
      const url = new URL(text);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || text;
    } catch {
      return text; // not a URL — treat raw text as the medicine ID
    }
  }

  async function startScan() {
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const elementId = "qr-reader";
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText: string) => {
          const medicineId = extractMedicineId(decodedText);
          scanner.stop().catch(() => {});
          router.push(`/verify/${encodeURIComponent(medicineId)}`);
        },
        () => {
          /* ignore per-frame scan failures */
        }
      );
    } catch (err) {
      console.error(err);
      setCameraError(
        "Could not access the camera. Check browser permissions, or enter the Medicine ID manually below."
      );
      setScanning(false);
    }
  }

  async function stopScan() {
    await scannerRef.current?.stop?.().catch(() => {});
    setScanning(false);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualId.trim()) return;
    router.push(`/verify/${encodeURIComponent(manualId.trim())}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div id="qr-reader" ref={containerRef as any} className="mx-auto max-w-sm overflow-hidden rounded-lg" />
        {!scanning && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Camera className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Camera is off</p>
            <Button onClick={startScan}>
              <Camera className="h-4 w-4" /> Start Scanner
            </Button>
          </div>
        )}
        {scanning && (
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={stopScan}>
              <CameraOff className="h-4 w-4" /> Stop Scanner
            </Button>
          </div>
        )}
        {cameraError && <p className="mt-3 text-sm text-red-600">{cameraError}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <Keyboard className="h-4 w-4" /> Enter Medicine ID manually
        </div>
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            placeholder="e.g. MED-IND-2026-000001"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
          <Button type="submit">Verify</Button>
        </form>
        <p className="mt-2 text-xs text-slate-400">Useful for desktop demonstrations without a camera.</p>
      </div>
    </div>
  );
}
