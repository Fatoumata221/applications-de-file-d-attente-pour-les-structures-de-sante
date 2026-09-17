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
      router.push("/rendez-vous");
    } catch (e) {
      setError("Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto min-h-screen flex flex-col">
      <div className="bg-primary px-6 pt-8 pb-10 rounded-b-3xl">
        <h1 className="font-serif text-xl font-semibold text-bg">Tour de Rôle</h1>
        <p className="text-sm text-white/80 mt-2">
          Prenez rendez-vous et suivez votre tour, sans attendre sur place.
        </p>
      </div>

      <div className="flex-1 px-6 py-6">
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-4">
          <h2 className="font-serif text-lg font-semibold">Connexion</h2>

          {step === "phone" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-muted">Numéro de téléphone</span>
                <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-3 bg-[#FBFAF6]">
                  <span className="text-muted">+221</span>
                  <input
                    className="bg-transparent outline-none flex-1"
                    placeholder="77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </label>
              <button
                onClick={handleSendOtp}
                disabled={phone.length < 9 || loading}
                className="bg-accent text-[#241705] font-semibold rounded-lg py-3 disabled:opacity-50"
              >
                {loading ? "Envoi…" : "Recevoir mon code par SMS"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-muted">Code reçu par SMS</span>
                <input
                  className="border border-primary rounded-lg px-3 py-3 text-center text-xl font-semibold tracking-widest"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
              </label>
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || loading}
                className="bg-primary text-white font-semibold rounded-lg py-3 disabled:opacity-50"
              >
                {loading ? "Vérification…" : "Valider et continuer"}
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <p className="text-xs text-muted text-center mt-4">
          Vos données de santé restent confidentielles et sécurisées.
        </p>
      </div>
    </main>
  );
}
