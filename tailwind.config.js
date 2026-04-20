/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        sand: {
          50: '#fff8f0',
          100: '#f7ead8',
          200: '#f0d7b6',
          300: '#e7bf8f',
          400: '#dc9b62',
          500: '#c9773f',
          600: '#ae612f',
          700: '#8f4d26',
          800: '#743f23',
          900: '#60351f',
        },
        terracotta: {
          50: '#fff3ee',
          100: '#ffe2d2',
          200: '#ffc4a5',
          300: '#ff9f72',
          400: '#f97b4a',
          500: '#e95f33',
          600: '#cf4923',
          700: '#ab391d',
          800: '#8a311e',
          900: '#712d1d',
        },
        olive: {
          50: '#f5f6ed',
          100: '#e6e9d5',
          200: '#cfd6b0',
          300: '#b0bc84',
          400: '#95a15f',
          500: '#788449',
          600: '#5d6839',
          700: '#495230',
          800: '#3a4229',
          900: '#323822',
        },
        midnight: '#201b16',
        parchment: '#f7ecdc',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
