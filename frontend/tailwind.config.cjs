/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeAura: 'fadeAura 1.5s ease-in-out forwards',
        fogMove: 'fogMove 30s linear infinite alternate'
      },
      keyframes: {
        fadeAura: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fogMove: {
          '0%': { transform: 'translateX(0px) translateY(0px)' },
          '100%': { transform: 'translateX(-30px) translateY(-20px)' }
        }
      }
    }
  },
  plugins: [],
};
