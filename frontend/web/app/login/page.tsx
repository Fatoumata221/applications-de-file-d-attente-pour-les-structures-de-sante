"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/otp";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSendOtp() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(`+221${phone}`);
      setStep("otp");
    } catch (e) {
      setError("Impossible d'envoyer le code, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(`+221${phone}`, code);
      router.push("/centres");
    } catch (e) {
      setError("Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col">
      <div className="animate-fade-in-up rounded-b-3xl bg-primary px-6 pb-10 pt-8">
        <h1 className="font-serif text-xl font-semibold text-white">
          Tour de Rôle
        </h1>
        <p className="mt-2 text-sm text-white/80">
          Prenez rendez-vous et suivez votre tour, sans attendre sur place.
        </p>
      </div>

      <div className="flex-1 px-6 py-6">
        <div
          className="animate-fade-in-up flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="font-serif text-lg font-semibold text-ink">
            Connexion
          </h2>

          {step === "phone" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink-soft">
                  Numéro de téléphone
                </span>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-3">
                  <span className="text-ink-soft">+221</span>
                  <input
                    className="flex-1 bg-transparent text-ink outline-none"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </label>
              <button
                onClick={handleSendOtp}
                disabled={phone.length < 9 || loading}
                className="rounded-[10px] bg-accent py-3 font-semibold text-primary-dark transition-opacity disabled:opacity-50"
              >
                {loading ? "Envoi…" : "Recevoir mon code par SMS"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ink-soft">
                  Code reçu par SMS
                </span>
                <input
                  className="rounded-lg border border-primary px-3 py-3 text-center text-xl font-semibold tracking-widest text-ink"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || loading}
                className="rounded-[10px] bg-primary py-3 font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {loading ? "Vérification…" : "Valider et continuer"}
              </button>
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <p className="mt-4 text-center text-xs text-ink-soft">
          Vos données de santé restent confidentielles et sécurisées.
        </p>
      </div>
    </main>
  );
}
