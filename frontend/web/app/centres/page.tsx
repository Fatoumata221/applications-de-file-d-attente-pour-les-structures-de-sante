"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";
import StatusPill, {
  queueLevelFromCount,
  type QueueLevel,
} from "@/components/StatusPill";

type Centre = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type CentreWithQueue = Centre & { level: QueueLevel; waiting: number };

export default function CentresPage() {
  const [centres, setCentres] = useState<CentreWithQueue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: centresData } = await supabase
        .from("centres")
        .select("id, name, address, city");

      const today = new Date().toISOString().slice(0, 10);
      const withQueue = await Promise.all(
        (centresData ?? []).map(async (centre) => {
          const { count } = await supabase
            .from("queue_tickets")
            .select("*", { count: "exact", head: true })
            .eq("centre_id", centre.id)
            .eq("status", "en_attente")
            .eq("queue_date", today);
          const waiting = count ?? 0;
          return { ...centre, waiting, level: queueLevelFromCount(waiting) };
        }),
      );
      setCentres(withQueue);
      setLoading(false);
    }
    load();
  }, []);

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

        {loading && (
          <p className="mt-8 text-sm text-ink-soft">Chargement…</p>
        )}

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
                    {[centre.address, centre.city].filter(Boolean).join(", ")}
                  </p>
                )}
                <div className="mt-3">
                  <StatusPill level={centre.level} />
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

          {!loading && centres.length === 0 && (
            <p className="text-sm text-ink-soft">
              Aucun centre disponible pour le moment.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
