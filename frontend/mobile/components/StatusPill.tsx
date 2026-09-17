import { StyleSheet, Text, View } from "react-native";
import { Fonts, useTheme } from "../constants/theme";

export type QueueLevel = "faible" | "moderee" | "longue";

export function queueLevelFromCount(count: number): QueueLevel {
  if (count <= 3) return "faible";
  if (count <= 8) return "moderee";
  return "longue";
}

export default function StatusPill({ level }: { level: QueueLevel }) {
  const theme = useTheme();
  const dotColor =
    level === "faible"
      ? theme.primary
      : level === "moderee"
        ? theme.accent
        : theme.danger;
  const label =
    level === "faible"
      ? "File courte"
      : level === "moderee"
        ? "File modérée"
        : "File longue";

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color: theme.inkSoft }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontFamily: Fonts.sansMedium, fontSize: 12 },
});
