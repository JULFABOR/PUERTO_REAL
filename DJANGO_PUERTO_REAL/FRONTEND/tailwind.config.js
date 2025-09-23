/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    'node_modules/flowbite-react/lib/esm/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'pr-yellow': '#FFC700',
        'pr-dark': '#121212',
        'pr-dark-gray': '#1F2937',
        'pr-gray': '#6B7280',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
      }
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}

