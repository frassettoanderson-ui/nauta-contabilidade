import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
