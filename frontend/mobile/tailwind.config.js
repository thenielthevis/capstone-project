/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx,ts,tsx}",
    "./design/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Base palette – referenced in your design tokens
        primary: "#38b6ff",
        secondary: "#2e5484",
        accent: "#10B981",

        // Neutral & background system
        background: "#FFFFFF",
        surface: "#F8FAFC",
        text: "#1a1916",

        // Optional expanded palette
        blue: {
          50: "#F0F3FA",
          100: "#D5DEEF",
          200: "#B1C9EF",
          300: "#8AAEE0",
          400: "#638ECB",
          500: "#395886",
        },
      },
    },
  },
  plugins: [],
};