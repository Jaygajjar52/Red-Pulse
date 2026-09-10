import type { Config } from 'tailwindcss';

/**
 * Design tokens live primarily in `src/index.css` (@theme) for Tailwind v4.
 * This file documents the Red Pulse visual system for tooling and editors.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff5f5',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
    },
  },
};

export default config;
