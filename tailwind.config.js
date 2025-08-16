/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sendbet-blue': '#1DA1F2',
        'sendbet-green': '#00C851',
        'sendbet-red': '#FF4444',
      }
    },
  },
  plugins: [],
}