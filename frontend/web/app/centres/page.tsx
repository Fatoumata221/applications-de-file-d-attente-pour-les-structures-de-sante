"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";
import StatusPill, {
  queueLevelFromCount,
  type QueueLevel,
} from "@/components/StatusPill";

// Minutes moyennes par patient en attente, pour estimer un temps
// d'attente à partir du nombre de personnes dans la file. Même valeur
// que celle utilisée sur l'écran file d'attente, pour rester cohérent.
const MINUTES_PER_PATIENT = 8;

type Centre = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type CentreWithQueue = Centre & {
  level: QueueLevel;
  waiting: number;
  estimatedMinutes: number;
};

type LoadState = "loading" | "ready" | "empty" | "error";

export default function CentresPage() {
  const [centres, setCentres] = useState<CentreWithQueue[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const { data: centresData, error: centresError } = await supabase
        .from("centres")
        .select("id, name, address, city");

      // Une policy RLS qui bloque la requête, un token expiré ou une
      // coupure réseau remontent ici comme une erreur Supabase — on ne
      // les laisse pas silencieusement afficher une liste vide.
      if (centresError) throw centresError;

      const today = new Date().toISOString().slice(0, 10);
      const withQueue = await Promise.all(
        (centresData ?? []).map(async (centre) => {
          const { count, error: queueError } = await supabase
            .from("queue_tickets")
            .select("*", { count: "exact", head: true })
            .eq("centre_id", centre.id)
            .eq("status", "en_attente")
            .eq("queue_date", today);
          if (queueError) throw queueError;

          const waiting = count ?? 0;
          return {
            ...centre,
            waiting,
            estimatedMinutes: waiting * MINUTES_PER_PATIENT,
            level: queueLevelFromCount(waiting),
          };
        }),
      );
      setCentres(withQueue);
      setState(withQueue.length === 0 ? "empty" : "ready");
    } catch (err) {
      console.error("Erreur de chargement des centres :", err);
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <NavTabs />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">
          Centres de santé
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Choisissez un centre pour prendre rendez-vous.
        </p>

        {state === "loading" && (
          <p className="mt-8 text-sm text-ink-soft">Chargement…</p>
        )}

        {state === "error" && (
          <div className="mt-6 flex flex-col items-start gap-2 rounded-xl border border-danger bg-surface p-5">
            <p className="text-sm font-semibold text-danger">
              Impossible de charger les centres
            </p>
            <p className="text-sm text-ink-soft">
              Vérifie ta connexion, ou réessaie dans un instant.
            </p>
            <button
              onClick={load}
              className="mt-2 rounded-[10px] bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Réessayer
            </button>
          </div>
        )}

        {state === "empty" && (
          <p className="mt-8 text-sm text-ink-soft">
            Aucun centre disponible pour le moment.
          </p>
        )}

        {state === "ready" && (
          <div className="mt-6 flex flex-col gap-4">
            {centres.map((centre, i) => (
              <Link
                key={centre.id}
                href={`/rendez-vous?centre=${centre.id}`}
                className="animate-fade-in-up flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-sm transition-transform hover:scale-[1.01]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink">
                    {centre.name}
                  </h2>
                  {(centre.address || centre.city) && (
                    <p className="mt-1 text-sm text-ink-soft">
                      {[centre.address, centre.city]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  <div className="mt-3">
                    <StatusPill
                      level={centre.level}
                      waiting={centre.waiting}
                      estimatedMinutes={centre.estimatedMinutes}
                    />
                  </div>
                </div>
                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    centre.level === "faible"
                      ? "bg-primary"
                      : centre.level === "moderee"
                        ? "bg-accent"
                        : "bg-danger"
                  }`}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
