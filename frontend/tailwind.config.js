/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        royal: {
          50: '#fdf2f2',
          100: '#fce4e4',
          200: '#f9c5c5',
          300: '#f39a9a',
          400: '#e85d5d',
          500: '#d32f2f',
          600: '#b71c1c',
          700: '#8B0000',
          800: '#6d0000',
          900: '#4a0000',
          950: '#2a0000',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f5edd6',
          200: '#ead9a8',
          300: '#dfc274',
          400: '#D4AF37',
          500: '#c49a2a',
          600: '#a87a22',
          700: '#865c1f',
          800: '#704b20',
          900: '#5f3f1e',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          50: '#FDFCFA',
          100: '#F5F0E8',
          200: '#EBE3D4',
        },
        charcoal: {
          DEFAULT: '#1A1A1A',
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#A3A3A3',
          400: '#737373',
          500: '#525252',
          600: '#404040',
          700: '#2A2A2A',
          800: '#1A1A1A',
          900: '#0D0D0D',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(0,0,0,0.08)',
        gold: '0 4px 20px -4px rgba(212, 175, 55, 0.35)',
        royal: '0 8px 32px -8px rgba(139, 0, 0, 0.35)',
        glass: '0 8px 32px 0 rgba(26, 26, 26, 0.12)',
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #8B0000 0%, #4a0000 50%, #1A1A1A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #c49a2a 50%, #865c1f 100%)',
        'hero-overlay':
          'linear-gradient(135deg, rgba(26,26,26,0.92) 0%, rgba(139,0,0,0.75) 50%, rgba(26,26,26,0.9) 100%)',
        'rail-pattern':
          'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(212,175,55,0.05) 40px, rgba(212,175,55,0.05) 42px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
