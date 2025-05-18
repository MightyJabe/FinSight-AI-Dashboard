/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', dark: '#3b82f6' },
        accent: { DEFAULT: '#0ea5e9', dark: '#38bdf8' },
        logoGradientStart: '#2563eb',
        logoGradientEnd: '#0ea5e9',
        logoText: '#2563eb',
        logoSubtitle: '#0ea5e9',
        logoNode: '#38bdf8',
        page: { DEFAULT: '#ffffff', dark: '#171717' },
        text: { DEFAULT: '#171717', dark: '#ffffff' },
        link: { DEFAULT: '#2563eb', dark: '#3b82f6' },
        background: {
          DEFAULT: '#ffffff',
          dark: '#171717',
        },
        foreground: {
          DEFAULT: '#171717',
          dark: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f3f4f6',
          dark: '#1f2937',
        },
        'secondary-foreground': {
          DEFAULT: '#1f2937',
          dark: '#f3f4f6',
        },
        muted: {
          DEFAULT: '#f3f4f6',
          dark: '#374151',
        },
        'muted-foreground': {
          DEFAULT: '#6b7280',
          dark: '#9ca3af',
        },
        border: {
          DEFAULT: '#e5e7eb',
          dark: '#374151',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1f2937',
        },
        'card-foreground': {
          DEFAULT: '#171717',
          dark: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms')],
};
