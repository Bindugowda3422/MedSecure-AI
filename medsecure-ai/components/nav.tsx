import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck className="h-6 w-6 text-brand-500" />
          MedSecure AI
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
          <Link href="/scan" className="hover:text-slate-900">Scan</Link>
          <Link href="/assistant" className="hover:text-slate-900">AI Assistant</Link>
          <Link href="/admin" className="hover:text-slate-900">Admin</Link>
        </nav>
        <Link
          href="/login"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Admin Login
        </Link>
      </div>
    </header>
  );
}
