/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        sidebar: { DEFAULT: '#0f172a', hover: '#1e293b', active: '#334155', text: '#94a3b8', 'text-active': '#f1f5f9' },
      },
    },
  },
  plugins: [],
}
