"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Row = {
  id: string;
  ticket_number: number;
  status: string;
};

export default function AgentPage() {
  const [queue, setQueue] = useState<Row[]>([]);

  async function load() {
    const { data } = await supabase
      .from("queue_tickets")
      .select("id, ticket_number, status")
      .eq("queue_date", new Date().toISOString().slice(0, 10))
      .order("ticket_number");
    setQueue(data ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("agent_queue")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tickets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  return (
    <main className="max-w-3xl mx-auto min-h-screen px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-xl font-semibold">File d'attente — aujourd'hui</h1>
        <button onClick={callNext} className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold">
          Appeler le patient suivant
        </button>
      </div>

      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 px-5 py-3 bg-[#FBFAF6] border-b border-border text-xs font-semibold text-muted">
          <span>Ticket</span>
          <span>Statut</span>
          <span>Action</span>
        </div>
        {queue.map((row) => (
          <div key={row.id} className="grid grid-cols-3 items-center px-5 py-3 border-b border-[#F2EFE4]">
            <span className="font-semibold text-primary">N°{String(row.ticket_number).padStart(3, "0")}</span>
            <span className="text-sm text-muted capitalize">{row.status.replace("_", " ")}</span>
            {row.status === "en_cours" ? (
              <button onClick={() => finish(row.id)} className="text-sm text-accent font-medium text-left">
                Marquer terminé
              </button>
            ) : (
              <span className="text-sm text-muted">—</span>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
