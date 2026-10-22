/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C1B',
          900: '#0B132B',
          850: '#0E1736',
          800: '#1C2541',
          700: '#233158',
          600: '#3A506B',
        },
        card: {
          bg: '#111C35',
          border: '#1E2D4A',
          hover: '#162343',
        },
        brand: {
          blue: '#2563EB',
          sky: '#38BDF8',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
