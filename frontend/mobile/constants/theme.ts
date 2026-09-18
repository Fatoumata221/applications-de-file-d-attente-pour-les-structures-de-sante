import { useColorScheme } from "react-native";

export const Colors = {
  light: {
    primary: "#145045",
    primaryDark: "#0D3730",
    // Text/icon color to place on top of `primary`. Light mode's primary is
    // a deep forest green, so white gives ~8.7:1 contrast (WCAG AAA).
    onPrimary: "#FFFFFF",
    accent: "#D9A441",
    accentSoft: "#F1DFB0",
    background: "#F2F5F1",
    surface: "#FFFFFF",
    surfaceAlt: "#EAF0EA",
    ink: "#1B211F",
    inkSoft: "#5B665F",
    border: "#DCE3DD",
    danger: "#C1502E",
  },
  dark: {
    primary: "#4CB79A",
    primaryDark: "#3A9A80",
    // Dark mode's primary is a light/medium teal, so white text on it only
    // gives ~2.5:1 contrast (fails WCAG AA). Use near-black instead (~8:1).
    onPrimary: "#0E1512",
    accent: "#E6B85C",
    accentSoft: "#3E3220",
    background: "#0E1512",
    surface: "#172420",
    surfaceAlt: "#1E2E29",
    ink: "#EDEFEA",
    inkSoft: "#A9B3AC",
    border: "#2A3B35",
    danger: "#E2735A",
  },
};

export const Fonts = {
  serif: "Fraunces_600SemiBold",
  serifBold: "Fraunces_700Bold",
  sans: "WorkSans_400Regular",
  sansMedium: "WorkSans_500Medium",
  sansSemiBold: "WorkSans_600SemiBold",
};

export function useTheme() {
  const scheme = useColorScheme();
  return Colors[scheme === "dark" ? "dark" : "light"];
}
