import { supabase } from "./supabaseClient";

export async function requestOtp(phone: string) {
  const { data, error } = await supabase.functions.invoke("send-otp", {
    body: { phone },
  });
  if (error) throw error;
  return data;
}

export async function verifyOtp(phone: string, code: string) {
  const { data, error } = await supabase.functions.invoke("verify-otp", {
    body: { phone, code },
  });
  if (error) throw error;

  if (data?.hashed_token) {
    // Échange le token du magic link contre une vraie session côté client
    const { error: sessionErr } = await supabase.auth.verifyOtp({
      token_hash: data.hashed_token,
      type: "magiclink",
    });
    if (sessionErr) throw sessionErr;
  }
  return data;
}
