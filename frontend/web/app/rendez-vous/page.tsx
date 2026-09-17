"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Service = { id: string; name: string; centre_id: string };
type Slot = { id: string; starts_at: string; service_id: string; is_booked: boolean };

export default function RendezVousPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    supabase
      .from("services")
      .select("id, name, centre_id")
      .then(({ data }) => setServices(data ?? []));
  }, []);

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
    await supabase.from("slots").update({ is_booked: true }).eq("id", selectedSlot);

    setConfirming(false);
    setConfirmed(true);
  }

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col px-5 py-6">
      <h1 className="font-serif text-xl font-semibold mb-6">Nouveau rendez-vous</h1>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="text-sm font-medium text-muted mb-2">Service</h2>
          <div className="flex flex-wrap gap-2">
            {services.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setSelectedService(svc.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  selectedService === svc.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-ink border-border"
                }`}
              >
                {svc.name}
              </button>
            ))}
          </div>
        </section>

        {selectedService && (
          <section>
            <h2 className="text-sm font-medium text-muted mb-2">Créneau disponible</h2>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`text-center py-2 rounded-lg text-sm font-medium border ${
                    selectedSlot === slot.id
                      ? "bg-accent text-[#241705] border-accent"
                      : "bg-white text-ink border-border"
                  }`}
                >
                  {new Date(slot.starts_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </button>
              ))}
              {slots.length === 0 && (
                <p className="col-span-3 text-sm text-muted">Aucun créneau disponible.</p>
              )}
            </div>
          </section>
        )}

        {selectedSlot && !confirmed && (
          <button
            onClick={confirmAppointment}
            disabled={confirming}
            className="bg-primary text-white font-semibold rounded-xl py-3 disabled:opacity-50"
          >
            {confirming ? "Confirmation…" : "Confirmer le rendez-vous"}
          </button>
        )}

        {confirmed && (
          <div className="bg-white border border-border rounded-xl p-4 text-sm">
            Rendez-vous confirmé ! Un code vous a été envoyé par SMS. Rendez-vous sur la page{" "}
            <a href="/file-attente" className="text-accent font-medium">
              File d'attente
            </a>{" "}
            le jour J.
          </div>
        )}
      </div>
    </main>
  );
}
