import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { requestOtp, verifyOtp } from "../lib/otp";

const colors = {
  primary: "#1E4E79",
  accent: "#E8734A",
  bg: "#F7F5EF",
  border: "#E4E0D5",
  ink: "#16232E",
  muted: "#8B9490",
};

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      await requestOtp(`+221${phone}`);
      setStep("otp");
    } catch {
      setError("Impossible d'envoyer le code, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(`+221${phone}`, code);
      router.replace("/rendez-vous");
    } catch {
      setError("Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>
        Prenez rendez-vous et suivez votre tour, sans attendre sur place.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Connexion</Text>

        {step === "phone" ? (
          <>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.prefix}>+221</Text>
              <TextInput
                style={styles.phoneInput}
                keyboardType="number-pad"
                placeholder="77 123 45 67"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              />
            </View>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={handleSend}
              disabled={phone.length < 9 || loading}
            >
              {loading ? <ActivityIndicator /> : <Text style={styles.buttonTextDark}>Recevoir mon code par SMS</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.label}>Code reçu par SMS</Text>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
            />
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleVerify}
              disabled={code.length < 6 || loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Valider et continuer</Text>}
            </Pressable>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20 },
  subtitle: { color: colors.muted, fontSize: 14, marginBottom: 20, lineHeight: 20 },
  card: { backgroundColor: "#fff", borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  cardTitle: { fontSize: 17, fontWeight: "600", color: colors.ink },
  label: { fontSize: 13, fontWeight: "500", color: colors.muted },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FBFAF6" },
  prefix: { color: colors.muted, fontSize: 15 },
  phoneInput: { flex: 1, fontSize: 15, color: colors.ink },
  otpInput: { borderWidth: 1, borderColor: colors.primary, borderRadius: 10, textAlign: "center", fontSize: 22, fontWeight: "600", paddingVertical: 12, letterSpacing: 6, color: colors.primary },
  button: { borderRadius: 10, paddingVertical: 13, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  buttonTextDark: { color: "#241705", fontWeight: "600", fontSize: 15 },
  error: { color: "#B7563B", fontSize: 13 },
});
