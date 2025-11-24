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
        'pr-yellow-dark': '#EAB308',
        'pr-dark': '#121212',
        'pr-dark-gray': '#1F2937',
        'pr-gray': '#D1D5DB',
        'pr-green': '#10B981',
        'pr-red': '#EF4444',
        'pr-blue': '#3B82F6',
        'pr-orange': '#F97316',
        'pr-purple': '#8B5CF6',
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

