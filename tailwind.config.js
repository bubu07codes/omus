/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        omus: {
          green: '#1DB954',
          base: '#121212',
          card: '#181818',
          hover: '#282828',
          sidebar: '#000000',
          border: '#282828'
        }
      }
    }
  },
  plugins: []
}
