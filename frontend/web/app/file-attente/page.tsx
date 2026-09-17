"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Ticket = {
  id: string;
  ticket_number: number;
  status: string;
  service_id: string;
};

export default function FileAttentePage() {
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data: appointment } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", userId)
        .eq("status", "confirme")
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!appointment) return;

      const { data: ticket } = await supabase
        .from("queue_tickets")
        .select("id, ticket_number, status, service_id")
        .eq("appointment_id", appointment.id)
        .maybeSingle();
      if (!ticket) return;
      setMyTicket(ticket);

      const { count } = await supabase
        .from("queue_tickets")
        .select("*", { count: "exact", head: true })
        .eq("service_id", ticket.service_id)
        .eq("status", "en_attente")
        .lt("ticket_number", ticket.ticket_number);
      setPosition(count ?? 0);
    }
    load();

    // Rafraîchissement temps réel : la file change pour tout le monde
    const channel = supabase
      .channel("queue_tickets_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tickets" }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!myTicket) {
    return (
      <main className="max-w-md mx-auto min-h-screen flex items-center justify-center px-5">
        <p className="text-muted text-sm">Aucun ticket actif pour le moment.</p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col px-5 py-6 gap-5">
      <h1 className="font-serif text-xl font-semibold">File d'attente</h1>

      <div className="bg-primary rounded-2xl p-6 flex flex-col items-center gap-1">
        <span className="text-xs font-medium text-white/70">VOTRE NUMÉRO DE TICKET</span>
        <span className="font-serif text-5xl font-semibold text-white">
          N°{String(myTicket.ticket_number).padStart(3, "0")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-muted">Patients avant vous</p>
          <p className="text-2xl font-semibold text-primary">{position}</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-4">
          <p className="text-xs text-muted">Attente estimée</p>
          <p className="text-2xl font-semibold text-primary">~{(position ?? 0) * 8} min</p>
        </div>
      </div>

      <p className="text-xs text-muted">
        La page se met à jour automatiquement. Vous recevrez aussi un SMS quand ce sera bientôt votre tour.
      </p>
    </main>
  );
}
