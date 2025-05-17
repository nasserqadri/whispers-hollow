/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      spacing: {
        '11': '4rem' // Override default 2.75rem with 4rem
      },
      animation: {
        fadeAura: 'fadeAura 1.5s ease-in-out forwards',
        fogMove: 'fogMove 30s linear infinite alternate',
        pulseWand: 'pulseWand 2s ease-in-out infinite',
        fadeIn: 'fadeIn 1.5s ease-in-out forwards' // NEW
      },
      keyframes: {
        fadeAura: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fogMove: {
          '0%': { transform: 'translateX(0px) translateY(0px)' },
          '100%': { transform: 'translateX(-30px) translateY(-20px)' }
        },
        pulseWand: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.75' }
        },
        fadeIn: { // NEW
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: [],
};
