import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { requestOtp, verifyOtp } from "../lib/otp";
import { Fonts, useTheme } from "../constants/theme";

export default function LoginScreen() {
  const theme = useTheme();
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
      router.replace("/centres");
    } catch {
      setError("Code incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
        Prenez rendez-vous et suivez votre tour, sans attendre sur place.
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: theme.ink }]}>
          Connexion
        </Text>

        {step === "phone" ? (
          <>
            <Text style={[styles.label, { color: theme.inkSoft }]}>
              Numéro de téléphone
            </Text>
            <View
              style={[
                styles.phoneRow,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceAlt,
                },
              ]}
            >
              <Text style={[styles.prefix, { color: theme.inkSoft }]}>
                +221
              </Text>
              <TextInput
                style={[styles.phoneInput, { color: theme.ink }]}
                keyboardType="number-pad"
                placeholder="77 123 45 67"
                placeholderTextColor={theme.inkSoft}
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
              />
            </View>
            <Pressable
              style={[
                styles.button,
                { backgroundColor: theme.accent },
                (phone.length < 9 || loading) && styles.buttonDisabled,
              ]}
              onPress={handleSend}
              disabled={phone.length < 9 || loading}
              accessibilityRole="button"
              accessibilityLabel="Recevoir mon code par SMS"
            >
              {loading ? (
                <ActivityIndicator />
              ) : (
                <Text
                  style={[styles.buttonText, { color: theme.primaryDark }]}
                >
                  Recevoir mon code par SMS
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.label, { color: theme.inkSoft }]}>
              Code reçu par SMS
            </Text>
            <TextInput
              style={[
                styles.otpInput,
                { borderColor: theme.primary, color: theme.primary },
              ]}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, ""))}
            />
            <Pressable
              style={[
                styles.button,
                { backgroundColor: theme.primary },
                (code.length < 6 || loading) && styles.buttonDisabled,
              ]}
              onPress={handleVerify}
              disabled={code.length < 6 || loading}
              accessibilityRole="button"
              accessibilityLabel="Valider et continuer"
            >
              {loading ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: theme.onPrimary }]}>
                  Valider et continuer
                </Text>
              )}
            </Pressable>
          </>
        )}

        {error && (
          <Text style={[styles.error, { color: theme.danger }]}>
            {error}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 18 },
  label: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  prefix: { fontFamily: Fonts.sans, fontSize: 15 },
  phoneInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 15 },
  otpInput: {
    borderWidth: 1,
    borderRadius: 10,
    textAlign: "center",
    fontFamily: Fonts.serif,
    fontSize: 22,
    paddingVertical: 12,
    letterSpacing: 6,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  error: { fontFamily: Fonts.sans, fontSize: 13 },
});
