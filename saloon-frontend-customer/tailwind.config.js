/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        surface: {
          DEFAULT: '#ffffff',
          soft: '#faf9ff',
          muted: '#f5f3ff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 0 0 1px rgba(124,58,237,0.07), 0 4px 16px rgba(124,58,237,0.07), 0 1px 3px rgba(0,0,0,0.05)',
        'card-hover': '0 0 0 1px rgba(124,58,237,0.18), 0 8px 32px rgba(124,58,237,0.13), 0 2px 8px rgba(0,0,0,0.08)',
        glow: '0 0 24px rgba(124,58,237,0.3)',
        'nav': '0 -1px 0 0 rgba(124,58,237,0.08), 0 -4px 16px rgba(124,58,237,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.8s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { from: { transform: 'scale(0.96)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        'brand-gradient-dark': 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 65%, #1e1b4b 100%)',
      },
    },
  },
  plugins: [],
}
