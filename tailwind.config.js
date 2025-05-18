/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#171717',
        primary: '#2563eb',
        'primary-foreground': '#ffffff',
        secondary: '#f3f4f6',
        'secondary-foreground': '#1f2937',
        muted: '#f3f4f6',
        'muted-foreground': '#6b7280',
        accent: '#0ea5e9',
        'accent-foreground': '#ffffff',
        border: '#e5e7eb',
        card: '#ffffff',
        'card-foreground': '#171717',
        logoGradientStart: '#2563eb',
        logoGradientEnd: '#0ea5e9',
        logoNode: '#38bdf8',
        logoText: '#2563eb',
        logoSubtitle: '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [],
} 