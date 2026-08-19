/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Refined per the Management Dashboard design spec — adopted app-wide
        // for visual consistency. text-muted intentionally reuses Tailwind's
        // gray-500 (#6B7280), which already meets the spec's 4.5:1 AA target.
        ink: "#16181D",
        paper: "#F4F5F7",
        sidebar: "#14161C",
        border: "#EFF0F3",
        accent: {
          DEFAULT: "#4F6BF6",
          dark: "#3A50D6",
          soft: "#E9EDFF",
        },
        gold: "#A97430",
        success: { DEFAULT: "#3FA76C", soft: "#E4F6EA" },
        warn: { DEFAULT: "#F59B4A", soft: "#FFF1E3" },
        critical: { DEFAULT: "#F0605D", soft: "#FFE9E9" },
        neutral: { DEFAULT: "#9AA0AC", soft: "#F0F1F4" },
        mint: { DEFAULT: "#CDEFD1", ink: "#1F6B3A" },
        lavender: { DEFAULT: "#DEDCFB", ink: "#4A47B0" },
        cream: { DEFAULT: "#F4EBD3", ink: "#8A6423" },
      },
      fontFamily: {
        sans: ["Public Sans", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Public Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        rail: "24px",
        card: "20px",
        ctrl: "14px",
        tile: "12px",
        lg: "0.85rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,22,28,0.04)",
        panel: "0 8px 24px rgba(20,22,28,0.06)",
      },
    },
  },
  plugins: [],
};
