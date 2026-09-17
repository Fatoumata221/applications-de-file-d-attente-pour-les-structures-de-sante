import { Stack } from "expo-router";

const colors = {
  primary: "#1E4E79",
  bg: "#F7F5EF",
};

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#FFFFFF",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tour de Rôle" }} />
      <Stack.Screen name="rendez-vous" options={{ title: "Nouveau rendez-vous" }} />
      <Stack.Screen name="file-attente" options={{ title: "File d'attente" }} />
    </Stack>
  );
}
