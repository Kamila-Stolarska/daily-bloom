/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F6F6EA',
          dark: '#EDE5D5',
          warm: '#EFE7D7',
        },
        ink: {
          DEFAULT: '#1A1614',
          soft: '#3A332C',
          muted: '#7A6F62',
        },
        accent: {
          gold: '#C9A24B',
          shadow: '#2C1F14',
        },
      },
      fontFamily: {
        serif: ['LibreBodoni_400Regular'],
        'serif-medium': ['LibreBodoni_500Medium'],
        'serif-semibold': ['LibreBodoni_600SemiBold'],
        'serif-bold': ['LibreBodoni_700Bold'],
        'serif-italic': ['LibreBodoni_400Regular_Italic'],
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
};
