import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Texto: tom escuro confortável, nunca preto absoluto.
        graphite: {
          950: "#211E19",
          900: "#2B2822",
          800: "#3C382F",
          700: "#54503F",
          600: "#6E6A57",
        },
        // Fundo: off-white/creme, cards em branco.
        cream: {
          25: "#FDFCFA",
          50: "#FBF8F2",
          100: "#F6F0E5",
          200: "#EEE4D1",
          300: "#E1D2B5",
        },
        // Secundária: verde oliva suave (cozinha, natural, sem agressividade).
        sage: {
          50: "#F2F5EC",
          100: "#E4EAD7",
          200: "#CBD8B2",
          400: "#9AAF77",
          500: "#7C9660",
          600: "#647A4B",
          700: "#4F6139",
        },
        // Destaque de CTA: terracota quente, aconchegante, sem ser vermelho puro.
        clay: {
          50: "#FBF1E9",
          100: "#F5DFC9",
          400: "#D98B5C",
          500: "#C4713F",
          600: "#AB5C2F",
          700: "#8C4A26",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(33, 30, 25, 0.08)",
        card: "0 2px 14px rgba(33, 30, 25, 0.06)",
        lift: "0 12px 32px rgba(33, 30, 25, 0.12)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
