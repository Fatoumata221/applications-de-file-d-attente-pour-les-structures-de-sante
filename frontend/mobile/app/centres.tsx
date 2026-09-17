import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabaseClient";
import { Fonts, useTheme } from "../constants/theme";
import PillTabs from "../components/PillTabs";
import StatusPill, {
  queueLevelFromCount,
  type QueueLevel,
} from "../components/StatusPill";

type Centre = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
};

type CentreWithQueue = Centre & { level: QueueLevel; waiting: number };

export default function CentresScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [centres, setCentres] = useState<CentreWithQueue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: centresData } = await supabase
        .from("centres")
        .select("id, name, address, city");

      const today = new Date().toISOString().slice(0, 10);
      const withQueue = await Promise.all(
        (centresData ?? []).map(async (centre) => {
          const { count } = await supabase
            .from("queue_tickets")
            .select("*", { count: "exact", head: true })
            .eq("centre_id", centre.id)
            .eq("status", "en_attente")
            .eq("queue_date", today);
          const waiting = count ?? 0;
          return { ...centre, waiting, level: queueLevelFromCount(waiting) };
        }),
      );
      setCentres(withQueue);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PillTabs />
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.ink }]}>
          Centres de santé
        </Text>
        <Text style={[styles.subtitle, { color: theme.inkSoft }]}>
          Choisissez un centre pour prendre rendez-vous.
        </Text>

        {loading && (
          <Text style={[styles.loading, { color: theme.inkSoft }]}>
            Chargement…
          </Text>
        )}

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
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.ink }]}>
                  {item.name}
                </Text>
                {(item.address || item.city) && (
                  <Text style={[styles.cardAddress, { color: theme.inkSoft }]}>
                    {[item.address, item.city].filter(Boolean).join(", ")}
                  </Text>
                )}
                <View style={{ marginTop: 8 }}>
                  <StatusPill level={item.level} />
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
          ListEmptyComponent={
            !loading ? (
              <Text style={{ color: theme.inkSoft, fontFamily: Fonts.sans }}>
                Aucun centre disponible pour le moment.
              </Text>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontFamily: Fonts.serif, fontSize: 22 },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
  loading: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 16 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 16 },
  cardAddress: { fontFamily: Fonts.sans, fontSize: 13, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
});
