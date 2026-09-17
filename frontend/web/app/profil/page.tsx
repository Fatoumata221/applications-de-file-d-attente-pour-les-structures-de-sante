"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavTabs from "@/components/NavTabs";

type Profile = {
  id: string;
  full_name: string | null;
  phone: string;
  notifications_sms: boolean;
  role: string;
};

export default function ProfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, notifications_sms, role")
        .eq("id", userId)
        .maybeSingle();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function toggleNotifications() {
    if (!profile) return;
    const next = !profile.notifications_sms;
    setProfile({ ...profile, notifications_sms: next });
    await supabase
      .from("profiles")
      .update({ notifications_sms: next })
      .eq("id", profile.id);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initial = profile?.full_name?.[0] ?? profile?.phone?.slice(-1) ?? "?";

  return (
    <>
      <NavTabs />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-6 py-8">
        <h1 className="font-serif text-2xl font-semibold text-ink">Profil</h1>

        {loading && <p className="text-sm text-ink-soft">Chargement…</p>}

        {!loading && !profile && (
          <p className="text-sm text-ink-soft">
            Connectez-vous pour voir votre profil.
          </p>
        )}

        {profile && (
          <>
            <div className="animate-fade-in-up flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft font-serif text-xl font-semibold uppercase text-primary-dark">
                {initial}
              </span>
              <div>
                <p className="font-serif text-lg font-semibold text-ink">
                  {profile.full_name || "Patient"}
                </p>
                <p className="text-sm text-ink-soft">{profile.phone}</p>
              </div>
            </div>

            <div
              className="animate-fade-in-up flex items-center justify-between rounded-xl border border-border bg-surface-alt p-4"
              style={{ animationDelay: "80ms" }}
            >
              <div>
                <p className="text-sm font-medium text-ink">
                  Notifications SMS
                </p>
                <p className="text-xs text-ink-soft">
                  Recevoir un SMS quand c&apos;est bientôt votre tour
                </p>
              </div>
              <button
                onClick={toggleNotifications}
                className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
                  profile.notifications_sms ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    profile.notifications_sms
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="animate-fade-in-up rounded-[10px] border border-danger py-3 font-semibold text-danger transition-opacity disabled:opacity-50"
              style={{ animationDelay: "140ms" }}
            >
              {signingOut ? "Déconnexion…" : "Se déconnecter"}
            </button>
          </>
        )}
      </main>
    </>
  );
}
