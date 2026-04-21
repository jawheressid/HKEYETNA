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
          50: '#f6f9fc',
          100: '#ebf1f7',
          200: '#dbe4ef',
          300: '#c8d4e3',
          400: '#b4c3d5',
          500: '#a3b5cb',
          600: '#8b9fb8',
          700: '#74869e',
          800: '#5d6e83',
          900: '#4b5869',
        },
        terracotta: {
          50: '#eef5fc',
          100: '#dceaf8',
          200: '#c4dcf0',
          300: '#a9cde8',
          400: '#8fbfe1',
          500: '#7caedd',
          600: '#6c9bc9',
          700: '#5a82ab',
          800: '#4a6b8b',
          900: '#3e5a76',
        },
        olive: {
          50: '#f4f7fa',
          100: '#e8eef4',
          200: '#d8e1eb',
          300: '#c3d0de',
          400: '#afc0d2',
          500: '#97b1c8',
          600: '#7f98b1',
          700: '#667a92',
          800: '#546476',
          900: '#45515f',
        },
        midnight: '#22374c',
        parchment: '#edf3f9',
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
