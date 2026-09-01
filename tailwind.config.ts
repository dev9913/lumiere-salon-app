import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#241C24",          // near-black plum-charcoal, primary text/dark sections
        parchment: "#FBF5EF",    // warm off-white base
        blush: "#F1DDD8",        // soft blush surface
        rosewood: "#8C3B4A",     // deep rose - primary brand accent
        clay: "#C97B63",         // warm terracotta-rose - secondary accent
        gold: "#B8965A",         // muted antique gold - highlight/CTA accent
        sage: "#6E7A63",         // muted sage - success/spa accent
        line: "#E7D9CF",         // hairline border color
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        soft: "2px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(36,28,36,0.06), 0 8px 24px -12px rgba(36,28,36,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
