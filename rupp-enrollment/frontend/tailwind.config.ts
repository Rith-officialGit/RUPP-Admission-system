import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RUPP-inspired palette: deep royal blue + gold accent
        brand: {
          50: "#eef3fb",
          100: "#d9e4f5",
          500: "#2f5fa8",
          600: "#244c8a",
          700: "#1b3b6f",
          900: "#0f2347",
        },
        gold: { 400: "#e2b94a", 500: "#c9a227" },
      },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
