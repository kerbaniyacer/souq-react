/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        arabic: ['"Cairo"', '"Tajawal"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#5C8A6E',
          50: '#f0f7f3',
          100: '#dceee5',
          200: '#bbddcc',
          300: '#8ec5ab',
          400: '#5C8A6E',
          500: '#4a7259',
          600: '#3a5b46',
          700: '#2f4938',
          800: '#263c2f',
          900: '#203227',
        },
        sage: {
          DEFAULT: '#5C8A6E',
          light: '#7aab8a',
          dark: '#3d6b52',
        },
        page: {
          bg: '#0F0F0F',
        },
        surface: '#1A1A1A',
        card: {
          DEFAULT: '#1E1E1E',
          hover: '#252525',
        },
        taupe: {
          DEFAULT: '#C9897A',
          light: '#D9A99D',
          dark: '#A8705F',
        },
        gold: '#D4A853',
        'dark-border': '#2E2E2E',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
