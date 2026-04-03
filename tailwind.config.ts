import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#182E3E',
        secondary: '#FFFFFF',
        accent: '#FACC15',
        background: '#F8FAFC',
        text: '#111827',
      },
    },
  },
  plugins: [],
}
export default config