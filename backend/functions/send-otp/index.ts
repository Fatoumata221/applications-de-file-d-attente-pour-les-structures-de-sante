// supabase/functions/send-otp/index.ts
//
// Génère un code OTP à 6 chiffres, le stocke (haché) dans otp_codes,
// et l'envoie par SMS via l'API LAMPUSH de LAfricaMobile.
//
// Déploiement :
//   supabase functions deploy send-otp
// Variables d'environnement à configurer (supabase secrets set) :
//   LAM_ACCOUNT_ID, LAM_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Tant que LAM_ACCOUNT_ID / LAM_PASSWORD ne sont pas configurés (compte
// LAfricaMobile pas encore activé), la fonction bascule en mode dev : le
// code n'est pas envoyé par SMS, il est juste affiché dans les logs de la
// fonction (dashboard Supabase → Edge Functions → send-otp → Logs).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LAM_ACCOUNT_ID = Deno.env.get("LAM_ACCOUNT_ID");
const LAM_PASSWORD = Deno.env.get("LAM_PASSWORD");
const LAM_SENDER = Deno.env.get("LAM_SENDER") ?? "TourDeRole";
const DEV_MODE = !LAM_ACCOUNT_ID || !LAM_PASSWORD;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Envoi via LAMPUSH (JSON). Adapter l'URL exacte selon la doc reçue
// de LAfricaMobile une fois le compte de production activé.
async function sendSms(phone: string, message: string) {
  const url = "https://api.lafricamobile.com/api/sms/json";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountid: LAM_ACCOUNT_ID,
      password: LAM_PASSWORD,
      sender: LAM_SENDER,
      to: phone,
      message,
    }),
  });
  if (!res.ok) {
    throw new Error(`Échec envoi SMS LAfricaMobile: ${res.status}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  try {
    const { phone } = await req.json();
    if (!phone || !/^\+221\d{9}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Numéro invalide (format attendu +221XXXXXXXXX)" }),
        { status: 400 }
      );
    }

    const code = generateOtp();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error } = await supabase.from("otp_codes").insert({
      phone,
      code_hash: codeHash,
      expires_at: expiresAt,
    });
    if (error) throw error;

    if (DEV_MODE) {
      console.log(`[DEV MODE] Code OTP pour ${phone} : ${code}`);
    } else {
      await sendSms(phone, `Tour de Rôle : votre code de connexion est ${code}. Valable 5 minutes.`);
    }

    return new Response(JSON.stringify({ ok: true, dev_mode: DEV_MODE }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
});
