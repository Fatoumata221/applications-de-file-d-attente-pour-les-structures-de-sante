"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_tickets" },
        load,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!myTicket) {
    return (
      <>
        <NavTabs />
        <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-6">
          <p className="text-sm text-ink-soft">
            Aucun ticket actif pour le moment.
          </p>
        </main>
      </>
    );
  }

  const totalAhead = Math.max(myTicket.ticket_number - 1, 0);
  const progressPct =
    totalAhead > 0
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(((totalAhead - (position ?? 0)) / totalAhead) * 100),
          ),
        )
      : 100;

  return (
    <>
      <NavTabs />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          File d&apos;attente
        </h1>

        <div className="animate-fade-in-up flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-widest text-ink-soft">
            Votre numéro de ticket
          </span>
          <span className="font-serif text-6xl font-semibold text-primary">
            N°{String(myTicket.ticket_number).padStart(3, "0")}
          </span>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-alt">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div
          className="animate-fade-in-up grid grid-cols-2 gap-3"
          style={{ animationDelay: "100ms" }}
        >
          <div className="rounded-xl border border-border bg-surface-alt p-4">
            <p className="text-xs text-ink-soft">Patients avant vous</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              {position}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-alt p-4">
            <p className="text-xs text-ink-soft">Attente estimée</p>
            <p className="mt-1 text-2xl font-semibold text-primary">
              ~{(position ?? 0) * 8} min
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-soft">
          Cette page se met à jour automatiquement. Vous recevrez aussi un SMS
          quand ce sera bientôt votre tour.
        </p>
      </main>
    </>
  );
}
