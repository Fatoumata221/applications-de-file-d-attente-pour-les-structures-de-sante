// supabase/functions/verify-otp/index.ts
//
// Vérifie le code OTP saisi, puis crée (si besoin) l'utilisateur Supabase
// et renvoie une session (magic link) exploitable côté client.
//
// Déploiement :
//   supabase functions deploy verify-otp

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return new Response(JSON.stringify({ error: "Téléphone et code requis" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { data: otpRow, error: fetchErr } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", phone)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !otpRow) {
      return new Response(JSON.stringify({ error: "Aucun code en attente pour ce numéro" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (new Date(otpRow.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Code expiré, redemandez-en un" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (otpRow.attempts >= 5) {
      return new Response(JSON.stringify({ error: "Trop de tentatives, redemandez un code" }), {
        status: 429,
        headers: corsHeaders,
      });
    }

    const codeHash = await hashCode(code);
    if (codeHash !== otpRow.code_hash) {
      await supabase.from("otp_codes").update({ attempts: otpRow.attempts + 1 }).eq("id", otpRow.id);
      return new Response(JSON.stringify({ error: "Code incorrect" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Code valide : on le consomme
    await supabase.from("otp_codes").update({ consumed: true }).eq("id", otpRow.id);

    // On retrouve ou crée l'utilisateur Supabase associé à ce numéro
    const fakeEmail = `${phone.replace("+", "")}@otp.tourderole.sn`;

    let userId: string;
    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users.find((u) => u.email === fakeEmail);

    if (found) {
      userId = found.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: fakeEmail,
        email_confirm: true,
        user_metadata: { phone },
      });
      if (createErr || !created.user) throw createErr;
      userId = created.user.id;

      await supabase.from("profiles").insert({ id: userId, phone });
    }

    // Génère un lien magique que le client échange contre une session
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: fakeEmail,
    });
    if (linkErr) throw linkErr;

    return new Response(
      JSON.stringify({
        ok: true,
        action_link: linkData.properties?.action_link,
        hashed_token: linkData.properties?.hashed_token,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
