import { usePathname, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Fonts, useTheme } from "../constants/theme";

const tabs = [
  { href: "/rendez-vous" as const, label: "Prendre RDV" },
  { href: "/file-attente" as const, label: "File d'attente" },
];

export default function PillTabs() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.track, { backgroundColor: theme.surfaceAlt }]}>
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Pressable
                key={tab.href}
                onPress={() => router.replace(tab.href)}
                style={[
                  styles.pill,
                  active && { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    { color: active ? "#fff" : theme.inkSoft },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  track: { flexDirection: "row", borderRadius: 999, padding: 4, gap: 4 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  pillText: { fontFamily: Fonts.sansMedium, fontSize: 13 },
});
