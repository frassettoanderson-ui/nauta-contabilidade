import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './obrigo/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta do módulo Obrigô (gestor-oa/web/tailwind.config.js, 1:1) ──
        petroleo: { 50: '#eef6f6', 100: '#d3e8e8', 200: '#a7d1d2', 300: '#6fb2b4', 400: '#3d8e91', 500: '#1f7376', 600: '#0f5c5e', 700: '#0c4a4c', 800: '#0b3c3e', 900: '#0a3133' },
        marca: {
          50: 'rgb(var(--marca-50) / <alpha-value>)',
          100: 'rgb(var(--marca-100) / <alpha-value>)',
          200: 'rgb(var(--marca-200) / <alpha-value>)',
          300: 'rgb(var(--marca-300) / <alpha-value>)',
          400: 'rgb(var(--marca-400) / <alpha-value>)',
          500: 'rgb(var(--marca-500) / <alpha-value>)',
          600: 'rgb(var(--marca-600) / <alpha-value>)',
          700: 'rgb(var(--marca-700) / <alpha-value>)',
          800: 'rgb(var(--marca-800) / <alpha-value>)',
          900: 'rgb(var(--marca-900) / <alpha-value>)',
        },
        status: { ok: '#88b87f', info: '#69a8d9', danger: '#d15b47', warn: '#ffb752' },
        marinho: { 50: '#eef2f8', 100: '#d6e0ee', 200: '#aebfda', 300: '#7e96c0', 400: '#4f6ba0', 500: '#2c4a80', 600: '#1b3a66', 700: '#13294b', 800: '#0e2240', 900: '#0a1a33' },
        roxo: { 50: '#f2f0f8', 100: '#e6e1f1', 200: '#d2cae6', 300: '#b3a7d4', 400: '#9585bf', 500: '#8171ac', 600: '#6d5d97', 700: '#5b4d7e' },
        fundo: '#f3f5f9',
        caixa: '#e8edf3',
        primary: {
          50:  '#f0f4ff',
          100: '#e0e8ff',
          200: '#c4d1ff',
          300: '#a0b2ff',
          400: '#7b8ff5',
          500: '#5c6fe0',
          600: '#4a5ac9',
          700: '#3D3B8E',
          800: '#322f78',
          900: '#272561',
          950: '#1a1840',
        },
        teal: {
          400: '#2dd4e0',
          500: '#0BBCD4',
          600: '#0999ae',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease-out forwards',
        'fade-in':    'fadeIn 0.5s ease-out forwards',
        'slide-down': 'slideDown 0.3s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%':   { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
    backgroundImage: {
      'gradient-dark': 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 100%)',
    },
  },
  plugins: [],
}

export default config
