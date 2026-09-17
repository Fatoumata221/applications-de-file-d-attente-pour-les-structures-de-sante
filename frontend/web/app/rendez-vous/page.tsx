"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";

type Service = { id: string; name: string; centre_id: string };
type Slot = {
  id: string;
  starts_at: string;
  service_id: string;
  is_booked: boolean;
};

function RendezVousContent() {
  const searchParams = useSearchParams();
  const centreId = searchParams.get("centre");

  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let query = supabase.from("services").select("id, name, centre_id");
    if (centreId) query = query.eq("centre_id", centreId);
    query.then(({ data }) => setServices(data ?? []));
  }, [centreId]);

  useEffect(() => {
    if (!selectedService) return;
    supabase
      .from("slots")
      .select("id, starts_at, service_id, is_booked")
      .eq("service_id", selectedService)
      .eq("is_booked", false)
      .order("starts_at")
      .then(({ data }) => setSlots(data ?? []));
  }, [selectedService]);

  async function confirmAppointment() {
    if (!selectedSlot || !selectedService) return;
    setConfirming(true);
    const { data: userData } = await supabase.auth.getUser();
    const patientId = userData.user?.id;
    const slot = slots.find((s) => s.id === selectedSlot);
    if (!patientId || !slot) return;

    const service = services.find((s) => s.id === selectedService);
    if (!service) return;

    await supabase.from("appointments").insert({
      patient_id: patientId,
      centre_id: service.centre_id,
      service_id: selectedService,
      slot_id: selectedSlot,
      scheduled_at: slot.starts_at,
    });
    await supabase
      .from("slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot);

    setConfirming(false);
    setConfirmed(true);
  }

  return (
    <>
      <NavTabs />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-8">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
          Nouveau rendez-vous
        </h1>

        <div className="flex flex-col gap-6">
          <section className="animate-fade-in-up">
            <h2 className="mb-2 text-sm font-medium text-ink-soft">Service</h2>
            <div className="flex flex-wrap gap-2">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedService(svc.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedService === svc.id
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-ink hover:border-primary/40"
                  }`}
                >
                  {svc.name}
                </button>
              ))}
              {services.length === 0 && (
                <p className="text-sm text-ink-soft">
                  Aucun service disponible pour ce centre.
                </p>
              )}
            </div>
          </section>

          {selectedService && (
            <section
              className="animate-fade-in-up"
              style={{ animationDelay: "80ms" }}
            >
              <h2 className="mb-2 text-sm font-medium text-ink-soft">
                Créneau disponible
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`rounded-lg border py-2 text-center text-sm font-medium transition-colors ${
                      selectedSlot === slot.id
                        ? "border-accent bg-accent text-primary-dark"
                        : "border-border bg-surface text-ink hover:border-accent/40"
                    }`}
                  >
                    {new Date(slot.starts_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Africa/Dakar",
                    })}
                  </button>
                ))}
                {slots.length === 0 && (
                  <p className="col-span-3 text-sm text-ink-soft">
                    Aucun créneau disponible.
                  </p>
                )}
              </div>
            </section>
          )}

          {selectedSlot && !confirmed && (
            <button
              onClick={confirmAppointment}
              disabled={confirming}
              className="animate-fade-in-up rounded-[10px] bg-primary py-3 font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {confirming ? "Confirmation…" : "Confirmer le rendez-vous"}
            </button>
          )}

          {confirmed && (
            <div className="animate-fade-in-up rounded-xl border border-border bg-surface p-4 text-sm text-ink">
              Rendez-vous confirmé ! Un code vous a été envoyé par SMS.
              Rendez-vous sur la page{" "}
              <a href="/file-attente" className="font-medium text-accent">
                File d&apos;attente
              </a>{" "}
              le jour J.
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function RendezVousPage() {
  return (
    <Suspense fallback={null}>
      <RendezVousContent />
    </Suspense>
  );
}
