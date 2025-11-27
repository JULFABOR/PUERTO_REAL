import flowbitePlugin from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
    'node_modules/flowbite-react/lib/esm/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        'pr-yellow': '#FFC700',
        'pr-orange': '#FF9900',        // Naranja amarillento principal
        'pr-orange-dark': '#E68A00',   // Naranja oscuro
        'pr-dark': '#0A0A0A',          // Negro puro
        'pr-dark-gray': '#1A1A1A',     // Negro oscuro (más claro)
        'pr-dark-gray-2': '#242424',   // Negro aún más claro
        'pr-gray': '#333333',          // Gris oscuro
        'pr-light-gray': '#5A5A5A',    // Gris más claro
        'pr-green': '#10B981',
        'pr-red': '#EF4444',
        'pr-blue': '#3B82F6',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [
    flowbitePlugin,
  ],
}

