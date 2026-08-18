/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c1815",
        "ink-2": "#262019",
        "ink-3": "#2f281f",
        paper: "#ede4cf",
        "paper-2": "#e2d6b3",
        "paper-line": "#c9bb92",
        brass: "#c99a3e",
        "brass-dark": "#a97e2f",
        stamp: "#a13d2f",
        "ink-text": "#2a2420",
        cream: "#ede4cf",
        muted: "#9a8f7b",
        box1: "#7a8f6b",
        box2: "#c99a3e",
        box3: "#b5713a",
        box4: "#8a5a8f",
        box5: "#a13d2f",
      },
      fontFamily: {
        display: ["'Special Elite'", "monospace"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        scan: { "0%": { left: "-40%" }, "100%": { left: "100%" } },
        dotPulse: {
          "0%, 60%, 100%": { opacity: 0.25, transform: "translateY(0)" },
          "30%": { opacity: 1, transform: "translateY(-2px)" },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        fieldFlash: {
          "0%": { boxShadow: "0 0 0 2px #c99a3e" },
          "100%": { boxShadow: "0 0 0 0 transparent" },
        },
      },
      animation: {
        scan: "scan 1.3s ease-in-out infinite",
        dotPulse: "dotPulse 1.1s ease-in-out infinite",
        fadeIn: "fadeIn .5s ease",
        fadeUp: "fadeUp .3s ease",
        fieldFlash: "fieldFlash 1s ease-out",
      },
    },
  },
  plugins: [],
};
