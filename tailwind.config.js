/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Indigo
        secondary: "#10b981", // Emerald
        dark: "#0f172a", // Slate 900
      },
    },
  },
  plugins: [],
}
