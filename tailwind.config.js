/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated warm lavender & cream paper base
        canvas: {
          light: '#F8F7F4', // Warm soft cream paper
          subtle: '#F0EFEA', // Slightly deeper warm neutral
          muted: '#E6E4DD',
        },
        ink: {
          primary: '#181824', // Deep midnight graphite
          secondary: '#555466', // Charcoal with slight violet undertone
          muted: '#8B8A99',
          faint: '#BCBBC7',
        },
        // Core Brand Accent: Violet / Lavender
        brand: {
          50: '#F4F2FF',
          100: '#E9E5FF',
          200: '#D5CCFF',
          300: '#B6A6FF',
          400: '#9478FF',
          500: '#754DF6', // Primary vibrant violet
          600: '#6031EB',
          700: '#4F23D1',
          800: '#411CAE',
          900: '#36188F',
        },
        // Warm Coral / Sunset accent (Sunsama / Todoist inspiration)
        coral: {
          50: '#FFF5F2',
          100: '#FFE8E1',
          200: '#FFD3C6',
          300: '#FFAFA4',
          400: '#FF7F6E',
          500: '#F6533C', // Vibrant warm coral
          600: '#E13720',
          700: '#BC2713',
        },
        // Mint / Emerald for completions & success
        mint: {
          50: '#F0FDF6',
          100: '#DCFCE9',
          200: '#BBF7D3',
          500: '#10B981',
          600: '#059669',
        },
        // Soft amber for priority flags
        honey: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          500: '#F59E0B',
          600: '#D97706',
        },
        // Dark theme backgrounds
        night: {
          base: '#0D0E15', // Deep midnight violet-slate
          surface: '#141622',
          card: '#1B1E2E',
          border: '#272B40',
          hover: '#22263A',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', 'Lora', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-brand': '0 0 20px -3px rgba(117, 77, 246, 0.25)',
        'glow-coral': '0 0 20px -3px rgba(246, 83, 60, 0.25)',
        'soft': '0 2px 10px -2px rgba(24, 24, 36, 0.04), 0 1px 3px -1px rgba(24, 24, 36, 0.02)',
        'elevated': '0 8px 24px -4px rgba(24, 24, 36, 0.08), 0 2px 6px -1px rgba(24, 24, 36, 0.03)',
        'floating': '0 20px 40px -12px rgba(24, 24, 36, 0.16), 0 4px 12px -2px rgba(24, 24, 36, 0.06)',
      }
    },
  },
  plugins: [],
}
