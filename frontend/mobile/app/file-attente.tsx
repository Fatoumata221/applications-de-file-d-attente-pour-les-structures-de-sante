import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../lib/supabaseClient";

const colors = { primary: "#1E4E79", bg: "#F7F5EF", border: "#E4E0D5", ink: "#16232E", muted: "#8B9490" };

type Ticket = { id: string; ticket_number: number; service_id: string };

export default function FileAttenteScreen() {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_tickets" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!ticket) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.muted }}>Aucun ticket actif pour le moment.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>VOTRE NUMÉRO DE TICKET</Text>
        <Text style={styles.ticketNumber}>N°{String(ticket.ticket_number).padStart(3, "0")}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Patients avant vous</Text>
          <Text style={styles.statValue}>{position}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Attente estimée</Text>
          <Text style={styles.statValue}>~{(position ?? 0) * 8} min</Text>
        </View>
      </View>

      <Text style={styles.note}>
        Cet écran se met à jour automatiquement. Vous recevrez aussi un SMS quand ce sera bientôt votre tour.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 16 },
  ticketCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 24, alignItems: "center", gap: 4 },
  ticketLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  ticketNumber: { color: "#fff", fontSize: 44, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#fff", borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16 },
  statLabel: { fontSize: 12, color: colors.muted },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.primary, marginTop: 4 },
  note: { fontSize: 12, color: colors.muted, lineHeight: 18 },
});
