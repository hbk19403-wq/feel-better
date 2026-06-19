/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1A3C5E',
          mid: '#2E75B6',
          light: '#D5E8F0',
        },
        accent: '#17A589',
        warning: '#F39C12',
        danger: '#E74C3C',
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
