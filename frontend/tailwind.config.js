/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090d",
          900: "#0c1118",
          800: "#121924",
          700: "#1a2433",
        },
        line: "#243044",
        accent: {
          DEFAULT: "#2dd4bf",
          dim: "#115e59",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 0 0 1px rgba(36,48,68,0.9), 0 18px 40px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
