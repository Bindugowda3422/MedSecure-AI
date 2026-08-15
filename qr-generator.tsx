"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

/**
 * Renders a QR code that encodes ONLY the verification URL/ID —
 * never full medicine data — per the spec.
 */
export function QrGenerator({ medicineId, verificationUrl }: { medicineId: string; verificationUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(verificationUrl, { width: 320, margin: 2 }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, verificationUrl, { width: 240, margin: 2 });
    }
    return () => {
      cancelled = true;
    };
  }, [verificationUrl]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${medicineId}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>${medicineId} QR</title></head><body style="text-align:center;font-family:sans-serif;padding:40px;">
        <h2>${medicineId}</h2>
        <img src="${dataUrl}" style="width:300px;height:300px" />
        <p style="color:#555;font-size:12px;">${verificationUrl}</p>
      </body></html>`
    );
    w.document.close();
    w.print();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="rounded-lg border border-slate-200 p-3 bg-white" />
      <p className="text-xs text-slate-500 break-all text-center max-w-xs">{verificationUrl}</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download QR
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print QR
        </Button>
      </div>
    </div>
  );
}
