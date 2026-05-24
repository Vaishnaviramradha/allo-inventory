/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        display: ["var(--font-display)", "serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0F0F0F",
          50: "#F8F8F8",
          100: "#EFEFEF",
          200: "#DCDCDC",
          300: "#B8B8B8",
          400: "#8F8F8F",
          500: "#666666",
          600: "#3D3D3D",
          700: "#2A2A2A",
          800: "#1A1A1A",
          900: "#0F0F0F",
        },
        amber: {
          DEFAULT: "#F5A623",
          light: "#FCD97A",
          dark: "#C27D0E",
        },
      },
      animation: {
        "countdown": "countdown linear forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "pulse-once": "pulseOnce 0.6s ease",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(12px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseOnce: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.05)" } },
      },
    },
  },
  plugins: [],
};
