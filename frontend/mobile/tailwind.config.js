/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#38b6ff',
          dark: '#1a90ff'
        },
        secondary: {
          light: '#2e5484',
          dark: '#90b3e0'
        },
        accent: {
          light: '#10B981',
          dark: '#34d399'
        },
        background: {
          light: '#FFFFFF',
          dark: '#111827'
        },
        surface: {
          light: '#F8FAFC',
          dark: '#1F2937'
        },
        text: {
          light: '#1a1916',
          dark: '#F3F4F6'
        },

        // Custom palette adjusted for dark mode
        customBlue: {
          50: {
            light: '#F0F3FA',
            dark: '#1E293B'
          },
          100: {
            light: '#D5DEEF',
            dark: '#334155'
          },
          200: {
            light: '#B1C9EF',
            dark: '#475569'
          },
          300: {
            light: '#8AAEE0',
            dark: '#64748B'
          },
          400: {
            light: '#638ECB',
            dark: '#94A3B8'
          },
          500: {
            light: '#395886',
            dark: '#CBD5E1'
          }
        },
      },
      fontFamily: {
        'sans': ['Inter'],
        'display': ['Poppins'],
        'body': ['Roboto'],
      },
    },
  },
  plugins: [],
}
