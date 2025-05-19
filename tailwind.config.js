/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Category colors
        'amber-500': 'rgb(var(--amber-500) / <alpha-value>)',
        'green-500': 'rgb(var(--green-500) / <alpha-value>)',
        'blue-600': 'rgb(var(--blue-600) / <alpha-value>)',
        'cyan-400': 'rgb(var(--cyan-400) / <alpha-value>)',
        'purple-500': 'rgb(var(--purple-500) / <alpha-value>)',
        'yellow-500': 'rgb(var(--yellow-500) / <alpha-value>)',
        'rose-500': 'rgb(var(--rose-500) / <alpha-value>)',
        'lime-400': 'rgb(var(--lime-400) / <alpha-value>)',
        'teal-500': 'rgb(var(--teal-500) / <alpha-value>)',
        'slate-500': 'rgb(var(--slate-500) / <alpha-value>)',

        // Theme colors
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark) / <alpha-value>)',
        },
        logoGradientStart: 'rgb(var(--logo-gradient-start) / <alpha-value>)',
        logoGradientEnd: 'rgb(var(--logo-gradient-end) / <alpha-value>)',
        logoText: 'rgb(var(--logo-text) / <alpha-value>)',
        logoSubtitle: 'rgb(var(--logo-subtitle) / <alpha-value>)',
        logoNode: 'rgb(var(--logo-node) / <alpha-value>)',

        // Light theme
        page: {
          DEFAULT: 'rgb(var(--page) / <alpha-value>)',
          dark: 'rgb(var(--page-dark) / <alpha-value>)',
        },
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          dark: 'rgb(var(--text-dark) / <alpha-value>)',
        },
        link: {
          DEFAULT: 'rgb(var(--link) / <alpha-value>)',
          dark: 'rgb(var(--link-dark) / <alpha-value>)',
        },
        background: {
          DEFAULT: 'rgb(var(--background) / <alpha-value>)',
          dark: 'rgb(var(--background-dark) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
          dark: 'rgb(var(--foreground-dark) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          dark: 'rgb(var(--secondary-dark) / <alpha-value>)',
        },
        'secondary-foreground': {
          DEFAULT: 'rgb(var(--secondary-foreground) / <alpha-value>)',
          dark: 'rgb(var(--secondary-foreground-dark) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          dark: 'rgb(var(--muted-dark) / <alpha-value>)',
        },
        'muted-foreground': {
          DEFAULT: 'rgb(var(--muted-foreground) / <alpha-value>)',
          dark: 'rgb(var(--muted-foreground-dark) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          dark: 'rgb(var(--border-dark) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          dark: 'rgb(var(--card-dark) / <alpha-value>)',
        },
        'card-foreground': {
          DEFAULT: 'rgb(var(--card-foreground) / <alpha-value>)',
          dark: 'rgb(var(--card-foreground-dark) / <alpha-value>)',
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
