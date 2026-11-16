/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./admin.html",
    "./undangan.html",
    "./app.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#005c55',
        'primary-container': '#0f766e',
        'on-primary': '#ffffff',
        secondary: '#1f6c3a',
        'secondary-container': '#a4f1b2',
        'on-secondary-container': '#24703e',
        tertiary: '#7f4025',
        'tertiary-container': '#d6eabf',
        'on-tertiary-container': '#121f06',
        background: '#f8fafc',
        'on-background': '#191c1b',
        surface: '#ffffff',
        'on-surface': '#0f172a',
        'surface-variant': '#e0e3e1',
        'on-surface-variant': '#475569',
        outline: '#6f7976',
        'outline-variant': '#e2e8f0',
        'surface-container-low': '#f1f5f9',
        rmi: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#005c55',
          600: '#004c46',
          700: '#003c37',
          800: '#002e2a',
          900: '#001f1c',
          gold: '#c99a2c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        amiri: ['Amiri', 'serif']
      }
    }
  },
  plugins: []
};
