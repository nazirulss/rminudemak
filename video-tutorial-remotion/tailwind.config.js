/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          950: '#011d17',
          900: '#003831',
          800: '#004e3c',
          700: '#046a53',
          600: '#059669',
          500: '#10b981',
          400: '#34d399',
        },
        gold: {
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      }
    },
  },
  plugins: [],
};
