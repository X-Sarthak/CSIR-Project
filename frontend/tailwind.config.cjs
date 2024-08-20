/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {fontSize: {
      'xxs': '0.625rem', // 10px
      'xxxs': '0.5rem', // 8px
    },
    spacing: {
      '30': '7.5rem', // 30 * 0.25rem = 7.5rem
      '18': '4.5rem', // 18 * 0.25rem = 4.5rem
      '45': '11.25rem', // 45 * 0.25rem = 11.25rem
      '43': '10.75rem', // 43 * 0.25rem = 10.75rem
      '44': '11.00rem', 
      '25': '6.25rem',
      '37': '9.25rem', 
      '21': '5.25rem', 

    },
  },
},
  plugins: [],
};
