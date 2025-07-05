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
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      // Semantic spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-left': 'slideLeft 0.3s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(var(--primary) / 0.5)' },
          '100%': { boxShadow: '0 0 20px rgb(var(--primary) / 0.8), 0 0 30px rgb(var(--primary) / 0.6)' },
        },
      },
      // Transition durations
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      // Custom shadows
      boxShadow: {
        'inner-sm': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 15px rgb(var(--primary) / 0.5)',
        'glow-lg': '0 0 30px rgb(var(--primary) / 0.6)',
      },
      // Background patterns
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.1) 50%, transparent 100%)',
      },
      // Container queries
      containers: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
      },
      // Aspect ratios
      aspectRatio: {
        '4/3': '4 / 3',
        '21/9': '21 / 9',
      },
      // Custom breakpoints for ultra-wide screens
      screens: {
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/aspect-ratio'),
  ],
};