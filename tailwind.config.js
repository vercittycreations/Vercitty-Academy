/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b9fc',
          400: '#8194f8',
          500: '#6370f1',
          600: '#4f4fe4',
          700: '#423dc9',
          800: '#3733a3',
          900: '#312f81',
          950: '#1e1b4b',
        },
        dark: {
          50:  '#f8f8f8',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#a8a8a8',
          400: '#737373',
          500: '#525252',
          600: '#3d3d3d',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#111111',
          950: '#080808',
        }
      },
      fontFamily: {
        // Fraunces — organic curves, editorial, very premium for headings
        display: ['"Fraunces"', 'serif'],
        // Plus Jakarta Sans — modern, rounded, clean for body text
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}