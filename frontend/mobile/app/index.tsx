import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts, useTheme } from "../constants/theme";

const steps = [
  {
    title: "Choisissez un centre",
    text: "Comparez les centres de santé disponibles près de chez vous et l'affluence en temps réel.",
  },
  {
    title: "Prenez rendez-vous",
    text: "Sélectionnez un service et un créneau libre en quelques secondes.",
  },
  {
    title: "Suivez votre tour",
    text: "Un ticket virtuel vous indique votre position exacte — venez seulement quand c'est bientôt votre tour.",
  },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.primary, paddingTop: insets.top + 24 },
        ]}
      >
        <Text style={[styles.eyebrow, { color: theme.accent }]}>
          Centres de santé sénégalais
        </Text>
        <Text style={[styles.heroTitle, { color: theme.onPrimary }]}>
          Votre tour, sans faire la queue.
        </Text>
        <Text style={[styles.heroText, { color: theme.onPrimary }]}>
          Prenez rendez-vous dans un centre de santé et suivez la file
          d&apos;attente en direct depuis votre téléphone.
        </Text>
        <Pressable
          style={[styles.ctaButton, { backgroundColor: theme.accent }]}
          onPress={() => router.push("/login")}
          accessibilityRole="button"
          accessibilityLabel="Se connecter"
        >
          <Text style={[styles.ctaText, { color: theme.primaryDark }]}>
            Se connecter
          </Text>
        </Pressable>
      </View>

      <View style={styles.stepsSection}>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          Comment ça marche
        </Text>
        {steps.map((step, i) => (
          <View
            key={step.title}
            style={[
              styles.stepCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.stepHeader}>
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: theme.accentSoft },
                ]}
              >
                <Text style={[styles.stepBadgeText, { color: theme.primaryDark }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={[styles.stepTitle, { color: theme.ink }]}>
                {step.title}
              </Text>
            </View>
            <Text style={[styles.stepText, { color: theme.inkSoft }]}>
              {step.text}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 24, paddingBottom: 40 },
  eyebrow: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: Fonts.serifBold,
    fontSize: 32,
    marginTop: 12,
    lineHeight: 38,
  },
  heroText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    opacity: 0.85,
    marginTop: 14,
    lineHeight: 22,
  },
  ctaButton: {
    marginTop: 24,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  stepsSection: { paddingHorizontal: 24, paddingTop: 28, gap: 12 },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 20, marginBottom: 8 },
  stepCard: { borderWidth: 1, borderRadius: 16, padding: 16 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { fontFamily: Fonts.serif, fontSize: 13 },
  stepTitle: { fontFamily: Fonts.serif, fontSize: 16, flexShrink: 1 },
  stepText: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 8, lineHeight: 19 },
});
