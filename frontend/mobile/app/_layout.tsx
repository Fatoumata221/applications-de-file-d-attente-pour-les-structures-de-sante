import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  useFonts,
} from "@expo-google-fonts/work-sans";
import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "../constants/theme";

export default function RootLayout() {
  const theme = useTheme();
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontFamily: "Fraunces_600SemiBold" },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tour de Rôle" }} />
      <Stack.Screen
        name="rendez-vous"
        options={{ title: "Nouveau rendez-vous" }}
      />
      <Stack.Screen
        name="file-attente"
        options={{ title: "File d'attente" }}
      />
    </Stack>
  );
}
