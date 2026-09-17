"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  ticket_number: number;
  status: string;
};

type AccessState = "checking" | "authorized" | "denied";

export default function AgentPage() {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [queue, setQueue] = useState<Row[]>([]);

  useEffect(() => {
    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setAccess("denied");
        router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile || !["agent", "admin"].includes(profile.role)) {
        setAccess("denied");
        router.replace("/login");
        return;
      }

      setAccess("authorized");
    }
    checkAccess();
  }, [router]);

  async function load() {
    const { data } = await supabase
      .from("queue_tickets")
      .select("id, ticket_number, status")
      .eq("queue_date", new Date().toISOString().slice(0, 10))
      .order("ticket_number");
    setQueue(data ?? []);
  }

  useEffect(() => {
    if (access !== "authorized") return;
    load();
    const channel = supabase
      .channel("agent_queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tickets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [access]);

  async function callNext() {
    const next = queue.find((r) => r.status === "en_attente");
    if (!next) return;
    await supabase
      .from("queue_tickets")
      .update({ status: "en_cours", called_at: new Date().toISOString() })
      .eq("id", next.id);
  }

  async function finish(id: string) {
    await supabase
      .from("queue_tickets")
      .update({ status: "termine", finished_at: new Date().toISOString() })
      .eq("id", id);
  }

  if (access !== "authorized") {
    return (
      <main className="max-w-3xl mx-auto min-h-screen flex items-center justify-center px-6">
        <p className="text-ink-soft text-sm">
          {access === "checking" ? "Vérification de l'accès…" : "Redirection…"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          File d&apos;attente — aujourd&apos;hui
        </h1>
        <button
          onClick={callNext}
          className="rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Appeler le patient suivant
        </button>
      </div>

      <div className="animate-fade-in-up overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="grid grid-cols-3 border-b border-border bg-surface-alt px-5 py-3 text-xs font-semibold text-ink-soft">
          <span>Ticket</span>
          <span>Statut</span>
          <span>Action</span>
        </div>
        {queue.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-3 items-center border-b border-border px-5 py-3 last:border-0"
          >
            <span className="font-serif font-semibold text-primary">
              N°{String(row.ticket_number).padStart(3, "0")}
            </span>
            <span className="text-sm capitalize text-ink-soft">
              {row.status.replace("_", " ")}
            </span>
            {row.status === "en_cours" ? (
              <button
                onClick={() => finish(row.id)}
                className="text-left text-sm font-medium text-accent"
              >
                Marquer terminé
              </button>
            ) : (
              <span className="text-sm text-ink-soft">—</span>
            )}
          </div>
        ))}
        {queue.length === 0 && (
          <p className="px-5 py-6 text-sm text-ink-soft">
            Aucun ticket pour aujourd&apos;hui.
          </p>
        )}
      </div>
    </main>
  );
}
