import Link from "next/link";
import { QrCode, ShieldCheck, Sparkles, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container-page py-20 sm:py-28 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> AI + Blockchain Medicine Verification
          </span>
          <h1 className="mt-6 text-4xl sm:text-6xl font-bold tracking-tight text-slate-900">
            MedSecure AI
          </h1>
          <p className="mt-3 text-lg sm:text-xl font-medium text-brand-700">
            Scan. Identify. Verify. Stay Safe.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-slate-600">
            MedSecure AI helps users identify medicines and verify the authenticity of their registered
            medicine records using QR technology, cryptographic hashing, blockchain and AI — built for a
            common problem in India: identifying loose tablets after a strip has been cut.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/scan">
              <Button size="lg">
                <ScanLine className="h-5 w-5" /> Scan Medicine
              </Button>
            </Link>
            <Link href="/scan">
              <Button size="lg" variant="outline">
                <QrCode className="h-5 w-5" /> Verify Medicine
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="ghost">
                <ShieldCheck className="h-5 w-5" /> Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-center text-2xl font-semibold text-slate-900">How it works</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-4">
          {[
            { title: "SCAN", desc: "Scan the QR code printed on the medicine strip or packaging." },
            { title: "IDENTIFY", desc: "Instantly retrieve the registered medicine information." },
            { title: "VERIFY", desc: "The record's hash is compared against the blockchain original." },
            { title: "UNDERSTAND", desc: "Ask the AI assistant questions about the verified medicine." },
          ].map((step, i) => (
            <Card key={step.title}>
              <CardContent className="text-center">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="mt-3 font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <strong>Demo data notice:</strong> This prototype uses demonstration medicine data for educational
          and research purposes. It does not imply government approval, pharmaceutical manufacturer
          certification, or clinical validation, and it cannot physically prove that an individual loose
          tablet is genuine — it verifies the associated registered medicine/batch record.
        </div>
      </section>
    </div>
  );
}
