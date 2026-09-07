/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0D1B2A',
          900: '#13273D',
          800: '#1E3A5F', // primary — deep institutional navy
          700: '#2A4E7C',
          600: '#3D6499',
          100: '#E7EDF4',
          50: '#F4F7FB',
        },
        marigold: {
          600: '#B96A1E',
          500: '#D9822B', // accent — Rajasthan marigold/saffron
          400: '#E89B4E',
          100: '#FBEBD8',
        },
        sage: {
          600: '#3F7A5E',
          500: '#4E9271',
          100: '#E3F1EA',
        },
        clay: {
          600: '#B4472F',
          500: '#C85A3F',
          100: '#F7E4DE',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,27,42,0.06), 0 8px 24px -8px rgba(13,27,42,0.10)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
