/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
          text: 'var(--primary-text)'
        },
        surface: {
          DEFAULT: 'var(--surface)',
          container: 'var(--surface-container)',
          high: 'var(--surface-high)',
          lowest: 'var(--surface-lowest)',
          border: 'var(--border)'
        },
        txt: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
};
