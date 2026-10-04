import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      container: { center: true, padding: "2rem" },
    },
  },
  plugins: [],
} satisfies Config;
