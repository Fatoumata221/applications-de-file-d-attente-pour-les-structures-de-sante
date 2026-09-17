import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabaseClient";
import { Fonts, useTheme } from "../constants/theme";
import PillTabs from "../components/PillTabs";

type Ticket = { id: string; ticket_number: number; service_id: string };

export default function FileAttenteScreen() {
  const theme = useTheme();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data: appointment } = await supabase
        .from("appointments")
        .select("id")
        .eq("patient_id", userId)
        .eq("status", "confirme")
        .limit(1)
        .maybeSingle();
      if (!appointment) return;

      const { data: t } = await supabase
        .from("queue_tickets")
        .select("id, ticket_number, service_id")
        .eq("appointment_id", appointment.id)
        .maybeSingle();
      if (!t) return;
      setTicket(t);

      const { count } = await supabase
        .from("queue_tickets")
        .select("*", { count: "exact", head: true })
        .eq("service_id", t.service_id)
        .eq("status", "en_attente")
        .lt("ticket_number", t.ticket_number);
      setPosition(count ?? 0);
    }
    load();

    const channel = supabase
      .channel("queue_mobile")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queue_tickets" },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!ticket) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <PillTabs />
        <View style={[styles.container, styles.centered]}>
          <Text style={{ color: theme.inkSoft, fontFamily: Fonts.sans }}>
            Aucun ticket actif pour le moment.
          </Text>
        </View>
      </View>
    );
  }

  const totalAhead = Math.max(ticket.ticket_number - 1, 0);
  const progressPct =
    totalAhead > 0
      ? Math.min(
          100,
          Math.max(
            5,
            Math.round(((totalAhead - (position ?? 0)) / totalAhead) * 100),
          ),
        )
      : 100;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PillTabs />
      <View style={styles.container}>
        <View
          style={[
            styles.ticketCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.ticketLabel, { color: theme.inkSoft }]}>
            VOTRE NUMÉRO DE TICKET
          </Text>
          <Text style={[styles.ticketNumber, { color: theme.primary }]}>
            N°{String(ticket.ticket_number).padStart(3, "0")}
          </Text>
          <View
            style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}
          >
            <LinearGradient
              colors={[theme.accent, theme.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPct}%` }]}
            />
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: theme.inkSoft }]}>
              Patients avant vous
            </Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {position}
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.statLabel, { color: theme.inkSoft }]}>
              Attente estimée
            </Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              ~{(position ?? 0) * 8} min
            </Text>
          </View>
        </View>

        <Text style={[styles.note, { color: theme.inkSoft }]}>
          Cet écran se met à jour automatiquement. Vous recevrez aussi un SMS
          quand ce sera bientôt votre tour.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  centered: { justifyContent: "center", alignItems: "center" },
  ticketCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  ticketLabel: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  ticketNumber: { fontFamily: Fonts.serifBold, fontSize: 48 },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 999 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 16 },
  statLabel: { fontFamily: Fonts.sans, fontSize: 12 },
  statValue: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    marginTop: 4,
  },
  note: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
});
