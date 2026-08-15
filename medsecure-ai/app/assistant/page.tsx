"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

function AssistantInner() {
  const params = useSearchParams();
  const [medicineId, setMedicineId] = useState(params.get("medicineId") || "");
  const [locked] = useState(Boolean(params.get("medicineId")));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !medicineId.trim()) return;

    const userMsg: Msg = { role: "user", content: question.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicineId: medicineId.trim(),
          question: userMsg.content,
          history: messages,
        }),
      });
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.answer || data.error || "No response." }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "The assistant is temporarily unavailable." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page py-12 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">MedSecure AI Assistant</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ask questions about a verified medicine. Answers are based only on its verified registry information.
      </p>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        MedSecure AI provides informational assistance and does not replace advice from a qualified
        healthcare professional.
      </div>

      {!locked && (
        <div className="mt-6">
          <label className="text-sm font-medium text-slate-700">Medicine ID</label>
          <input
            value={medicineId}
            onChange={(e) => setMedicineId(e.target.value)}
            placeholder="e.g. MED-IND-2026-000001"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
      )}
      {locked && (
        <p className="mt-4 text-sm text-slate-600">
          Discussing: <span className="font-mono">{medicineId}</span>
        </p>
      )}

      <Card className="mt-6">
        <CardContent className="space-y-4">
          <div className="min-h-[240px] space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-slate-400">No messages yet — ask a question below.</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-lg p-3 text-sm",
                  m.role === "user" ? "bg-brand-50 text-slate-800" : "bg-slate-50 text-slate-800"
                )}
              >
                {m.role === "user" ? (
                  <User className="h-4 w-4 mt-0.5 shrink-0 text-brand-600" />
                ) : (
                  <Bot className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
            {loading && <p className="text-xs text-slate-400">Thinking...</p>}
          </div>

          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What is this medicine used for?"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <Button type="submit" disabled={loading || !medicineId.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={null}>
      <AssistantInner />
    </Suspense>
  );
}
