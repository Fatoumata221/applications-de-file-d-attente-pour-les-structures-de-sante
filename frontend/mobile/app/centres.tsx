import { useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { Fonts, useTheme } from "../constants/theme";
import PillTabs from "../components/PillTabs";
import StatusPill, {
  queueLevelFromCount,
  type QueueLevel,
} from "../components/StatusPill";

// Minutes moyennes par patient en attente, pour estimer un temps
// d'attente à partir du nombre de personnes dans la file. Même valeur
// que celle utilisée sur l'écran file d'attente, pour rester cohérent.
const MINUTES_PER_PATIENT = 8;

type Centre = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type CentreWithQueue = Centre & {
  level: QueueLevel;
  waiting: number;
  estimatedMinutes: number;
};

type LoadState = "loading" | "ready" | "empty" | "error";

export default function CentresScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [centres, setCentres] = useState<CentreWithQueue[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const { data: centresData, error: centresError } = await supabase
        .from("centres")
        .select("id, name, address, city");

      // Une policy RLS qui bloque la requête, un token expiré ou une
      // coupure réseau remontent ici comme une erreur Supabase —
      // on ne les laisse pas silencieusement afficher une liste vide.
      if (centresError) throw centresError;

      const today = new Date().toISOString().slice(0, 10);
      const withQueue = await Promise.all(
        (centresData ?? []).map(async (centre) => {
          const { count, error: queueError } = await supabase
            .from("queue_tickets")
            .select("*", { count: "exact", head: true })
            .eq("centre_id", centre.id)
            .eq("status", "en_attente")
            .eq("queue_date", today);
          if (queueError) throw queueError;

          const waiting = count ?? 0;
          return {
            ...centre,
            waiting,
            estimatedMinutes: waiting * MINUTES_PER_PATIENT,
            level: queueLevelFromCount(waiting),
          };
        }),
      );
      setCentres(withQueue);
      setState(withQueue.length === 0 ? "empty" : "ready");
    } catch (err) {
      console.error("Erreur de chargement des centres :", err);
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PillTabs />
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <Text style={[styles.title, { color: theme.ink }]}>
          Centres de santé
        </Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
          Choisissez un centre pour prendre rendez-vous.
        </Text>

        {state === "loading" && (
          <Text style={[styles.message, { color: theme.inkSoft }]}>
            Chargement…
          </Text>
        )}

        {state === "error" && (
          <View
            style={[
              styles.messageCard,
              { backgroundColor: theme.surface, borderColor: theme.danger },
            ]}
          >
            <Text style={[styles.messageTitle, { color: theme.danger }]}>
              Impossible de charger les centres
            </Text>
            <Text style={[styles.message, { color: theme.inkSoft }]}>
              Vérifie ta connexion, ou réessaie dans un instant.
            </Text>
            <Pressable
              onPress={load}
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Réessayer le chargement des centres"
            >
              <Text style={[styles.retryText, { color: theme.onPrimary }]}>
                Réessayer
              </Text>
            </Pressable>
          </View>
        )}

        {state === "empty" && (
          <Text style={[styles.message, { color: theme.inkSoft }]}>
            Aucun centre disponible pour le moment.
          </Text>
        )}

        {state === "ready" && (
          <FlatList
            data={centres}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingTop: 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/rendez-vous",
                    params: { centre: item.id },
                  })
                }
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${
                  item.waiting === 0
                    ? "aucune attente"
                    : `${item.waiting} personnes en attente, environ ${item.estimatedMinutes} minutes`
                }`}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.ink }]}>
                    {item.name}
                  </Text>
                  {(item.address || item.city) && (
                    <Text
                      style={[styles.cardAddress, { color: theme.inkSoft }]}
                    >
                      {[item.address, item.city].filter(Boolean).join(", ")}
                    </Text>
                  )}
                  <View style={{ marginTop: 8 }}>
                    <StatusPill
                      level={item.level}
                      waiting={item.waiting}
                      estimatedMinutes={item.estimatedMinutes}
                    />
                  </View>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        item.level === "faible"
                          ? theme.primary
                          : item.level === "moderee"
                            ? theme.accent
                            : theme.danger,
                    },
                  ]}
                />
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontFamily: Fonts.serif, fontSize: 22 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
  message: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 16 },
  messageCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    gap: 4,
  },
  messageTitle: { fontFamily: Fonts.sansSemiBold, fontSize: 14 },
  retryButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: { fontFamily: Fonts.sansSemiBold, fontSize: 13 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    minHeight: 44,
  },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 16 },
  cardAddress: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
});
