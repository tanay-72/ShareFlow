import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8db2ff',
          400: '#5687ff',
          500: '#2f5eff',
          600: '#1c3ff5',
          700: '#172fe0',
          800: '#1827b5',
          900: '#19278e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
