import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabaseClient";
import { Fonts, useTheme } from "../constants/theme";
import PillTabs from "../components/PillTabs";

type Service = { id: string; name: string; centre_id: string };
type Slot = { id: string; starts_at: string; service_id: string };

export default function RendezVousScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { centre: centreId } = useLocalSearchParams<{ centre?: string }>();
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let query = supabase.from("services").select("id, name, centre_id");
    if (centreId) query = query.eq("centre_id", centreId);
    query.then(({ data, error: err }) => {
      if (err) {
        console.error("Erreur de chargement des services :", err);
        setError("Impossible de charger les services. Réessaie plus tard.");
        return;
      }
      setError(null);
      setServices(data ?? []);
    });
  }, [centreId]);

  useEffect(() => {
    if (!selectedService) return;
    supabase
      .from("slots")
      .select("id, starts_at, service_id")
      .eq("service_id", selectedService)
      .eq("is_booked", false)
      .then(({ data, error: err }) => {
        if (err) {
          console.error("Erreur de chargement des créneaux :", err);
          setError("Impossible de charger les créneaux. Réessaie plus tard.");
          return;
        }
        setError(null);
        setSlots(data ?? []);
      });
  }, [selectedService]);

  async function confirm() {
    if (!selectedSlot || !selectedService) return;
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const patientId = userData.user?.id;
    const slot = slots.find((s) => s.id === selectedSlot);
    const service = services.find((s) => s.id === selectedService);
    if (!patientId || !slot || !service) {
      setError("Session expirée, reconnecte-toi pour confirmer.");
      return;
    }

    const { error: insertError } = await supabase
      .from("appointments")
      .insert({
        patient_id: patientId,
        centre_id: service.centre_id,
        service_id: selectedService,
        slot_id: selectedSlot,
        scheduled_at: slot.starts_at,
      });
    if (insertError) {
      console.error("Erreur de confirmation du rendez-vous :", insertError);
      setError("Impossible de confirmer le rendez-vous. Réessaie.");
      return;
    }
    await supabase
      .from("slots")
      .update({ is_booked: true })
      .eq("id", selectedSlot);
    setConfirmed(true);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <PillTabs />
      <View
        style={[styles.container, { paddingBottom: insets.bottom + 20 }]}
      >
        {error && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.surface, borderColor: theme.danger },
            ]}
          >
            <Text style={{ color: theme.danger, fontFamily: Fonts.sans, fontSize: 13 }}>
              {error}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: theme.inkSoft }]}>
          Service
        </Text>
        {services.length === 0 && !error && (
          <Text style={{ color: theme.inkSoft, fontFamily: Fonts.sans, fontSize: 13 }}>
            Aucun service disponible pour ce centre.
          </Text>
        )}
        <View style={styles.chipRow}>
          {services.map((svc) => {
            const active = selectedService === svc.id;
            return (
              <Pressable
                key={svc.id}
                onPress={() => setSelectedService(svc.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? theme.primary : theme.border,
                    backgroundColor: active ? theme.primary : theme.surface,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={svc.name}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? theme.onPrimary : theme.ink },
                  ]}
                >
                  {svc.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {selectedService && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.inkSoft }]}>
              Créneau disponible
            </Text>
            <FlatList
              data={slots}
              numColumns={3}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const active = selectedSlot === item.id;
                return (
                  <Pressable
                    onPress={() => setSelectedSlot(item.id)}
                    style={[
                      styles.slot,
                      {
                        borderColor: active ? theme.accent : theme.border,
                        backgroundColor: active
                          ? theme.accent
                          : theme.surface,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        { color: active ? theme.primaryDark : theme.ink },
                      ]}
                    >
                      {new Date(item.starts_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Dakar",
                      })}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </>
        )}

        {selectedSlot && !confirmed && (
          <Pressable
            style={[styles.confirmButton, { backgroundColor: theme.primary }]}
            onPress={confirm}
            accessibilityRole="button"
            accessibilityLabel="Confirmer le rendez-vous"
          >
            <Text style={[styles.confirmText, { color: theme.onPrimary }]}>
              Confirmer le rendez-vous
            </Text>
          </Pressable>
        )}

        {confirmed && (
          <Text
            style={[
              styles.confirmedText,
              {
                color: theme.ink,
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            Rendez-vous confirmé ! Un SMS vous a été envoyé.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  sectionLabel: { fontFamily: Fonts.sansMedium, fontSize: 13, marginBottom: 6 },
  errorBanner: { borderWidth: 1, borderRadius: 12, padding: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  chipText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  slot: {
    flex: 1,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  slotText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
  confirmButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  confirmText: { fontFamily: Fonts.sansSemiBold, fontSize: 15 },
  confirmedText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
});
