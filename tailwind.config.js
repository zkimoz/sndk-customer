/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          950: '#0D0108',
          900: '#1A030A',
          800: '#3D0818',
          700: '#5c0e25',
          600: '#6B102C',
          500: '#8A1538',
          400: '#A01B42',
          300: '#B8214E',
        },
        gold: {
          900: '#7A5A0A',
          700: '#B8961F',
          500: '#D4AF37',
          400: '#E3C24A',
          300: '#F0CC60',
          200: '#F7DF8A',
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
