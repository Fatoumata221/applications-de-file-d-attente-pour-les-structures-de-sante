import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { supabase } from "../lib/supabaseClient";

const colors = { primary: "#1E4E79", accent: "#E8734A", bg: "#F7F5EF", border: "#E4E0D5", ink: "#16232E", muted: "#8B9490" };

type Service = { id: string; name: string; centre_id: string };
type Slot = { id: string; starts_at: string; service_id: string };

export default function RendezVousScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    supabase.from("services").select("id, name, centre_id").then(({ data }) => setServices(data ?? []));
  }, []);

  useEffect(() => {
    if (!selectedService) return;
    supabase
      .from("slots")
      .select("id, starts_at, service_id")
      .eq("service_id", selectedService)
      .eq("is_booked", false)
      .then(({ data }) => setSlots(data ?? []));
  }, [selectedService]);

  async function confirm() {
    if (!selectedSlot || !selectedService) return;
    const { data: userData } = await supabase.auth.getUser();
    const patientId = userData.user?.id;
    const slot = slots.find((s) => s.id === selectedSlot);
    const service = services.find((s) => s.id === selectedService);
    if (!patientId || !slot || !service) return;

    await supabase.from("appointments").insert({
      patient_id: patientId,
      centre_id: service.centre_id,
      service_id: selectedService,
      slot_id: selectedSlot,
      scheduled_at: slot.starts_at,
    });
    await supabase.from("slots").update({ is_booked: true }).eq("id", selectedSlot);
    setConfirmed(true);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Service</Text>
      <View style={styles.chipRow}>
        {services.map((svc) => (
          <Pressable
            key={svc.id}
            onPress={() => setSelectedService(svc.id)}
            style={[styles.chip, selectedService === svc.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Text style={[styles.chipText, selectedService === svc.id && { color: "#fff" }]}>{svc.name}</Text>
          </Pressable>
        ))}
      </View>

      {selectedService && (
        <>
          <Text style={styles.sectionLabel}>Créneau disponible</Text>
          <FlatList
            data={slots}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedSlot(item.id)}
                style={[styles.slot, selectedSlot === item.id && { backgroundColor: colors.accent, borderColor: colors.accent }]}
              >
                <Text style={styles.slotText}>
                  {new Date(item.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </Pressable>
            )}
          />
        </>
      )}

      {selectedSlot && !confirmed && (
        <Pressable style={styles.confirmButton} onPress={confirm}>
          <Text style={styles.confirmText}>Confirmer le rendez-vous</Text>
        </Pressable>
      )}

      {confirmed && <Text style={styles.confirmedText}>Rendez-vous confirmé ! Un SMS vous a été envoyé.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, gap: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "500", color: colors.muted, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff" },
  chipText: { fontSize: 13, fontWeight: "500", color: colors.ink },
  slot: { flex: 1, margin: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", alignItems: "center" },
  slotText: { fontSize: 13, fontWeight: "500", color: colors.ink },
  confirmButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  confirmText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  confirmedText: { fontSize: 13, color: colors.ink, backgroundColor: "#fff", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
});
