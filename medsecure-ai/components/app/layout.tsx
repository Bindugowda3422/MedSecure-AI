import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "MedSecure AI — Scan. Identify. Verify. Stay Safe.",
  description:
    "AI + blockchain medicine identification and authenticity verification. Educational/demo prototype.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main>{children}</main>
        <footer className="border-t border-slate-200 py-8 mt-16">
          <div className="container-page text-center text-xs text-slate-400 space-y-1">
            <p>
              This prototype uses demonstration medicine data and is intended for educational and research
              purposes. It does not replace official pharmaceutical verification systems or professional
              medical advice.
            </p>
            <p>© {new Date().getFullYear()} MedSecure AI — Demo project.</p>
          </div>
        </footer>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
