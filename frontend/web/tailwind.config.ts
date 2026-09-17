import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E4E79",
        "primary-dark": "#153A5C",
        accent: "#E8734A",
        bg: "#F7F5EF",
        ink: "#16232E",
        muted: "#8B9490",
        border: "#E4E0D5",
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Work Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
