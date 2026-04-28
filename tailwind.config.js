/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        surface: {
          900: '#0a0f1a',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
          500: '#475569',
        },
        accent: {
          DEFAULT: '#38bdf8',
          hover:   '#7dd3fc',
          muted:   '#0c4a6e',
        },
        success: '#4ade80',
        warning: '#fb923c',
        danger:  '#f87171',
      },
      animation: {
        'slide-up':   'slideUp 0.22s ease-out',
        'fade-in':    'fadeIn 0.18s ease-out',
        'scale-in':   'scaleIn 0.16s ease-out',
      },
      keyframes: {
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
