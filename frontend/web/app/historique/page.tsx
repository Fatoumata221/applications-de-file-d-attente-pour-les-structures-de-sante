"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";

type AppointmentRow = {
  id: string;
  scheduled_at: string;
  status: string;
  services: { name: string } | null;
  centres: { name: string } | null;
};

const statusLabels: Record<string, string> = {
  confirme: "Confirmé",
  termine: "Terminé",
  annule: "Annulé",
  absent: "Absent",
};

export default function HistoriquePage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, services(name), centres(name)")
        .eq("patient_id", userId)
        .order("scheduled_at", { ascending: false });
      setAppointments((data as unknown as AppointmentRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      <NavTabs />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Historique
        </h1>

        {loading && <p className="text-sm text-ink-soft">Chargement…</p>}

        {!loading && appointments.length === 0 && (
          <p className="text-sm text-ink-soft">
            Aucun rendez-vous pour le moment.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {appointments.map((appt, i) => (
            <div
              key={appt.id}
              className="animate-fade-in-up flex items-center justify-between rounded-xl border border-border bg-surface p-4 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div>
                <p className="font-medium text-ink">
                  {appt.services?.name ?? "Service"}
                </p>
                <p className="text-sm text-ink-soft">
                  {appt.centres?.name ?? "Centre"} ·{" "}
                  {new Date(appt.scheduled_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Africa/Dakar",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  appt.status === "confirme"
                    ? "bg-accent-soft text-primary-dark"
                    : appt.status === "termine"
                      ? "bg-surface-alt text-ink-soft"
                      : "bg-danger/10 text-danger"
                }`}
              >
                {statusLabels[appt.status] ?? appt.status}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
