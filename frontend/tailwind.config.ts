import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "#d9e0ea",
        background: "#f6f8fb",
        foreground: "#172033",
        primary: "#2563eb",
        muted: "#667085",
        amber: "#f59e0b",
        success: "#16a34a"
      },
      boxShadow: {
        panel: "0 18px 60px rgba(22, 32, 51, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
