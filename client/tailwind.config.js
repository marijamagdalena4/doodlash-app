/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        'accent-pink': '#EC4899',
        'accent-yellow': '#FFD93D',
        success: '#6BCB77',
        danger: '#FF6B6B',
        'bg-game': '#F0EDFF',
        'bg-card': '#FFFFFF',
        'text-primary': '#1E293B',
        'text-muted': '#64748B',
      },
      fontFamily: {
        logo: ['"Fredoka One"', 'cursive'],
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
