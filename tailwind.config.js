/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:      '#1a1a1a',
        surface: '#242424',
        border:  '#333',
        text:    '#e0e0e0',
        muted:   '#888',
        green:   '#4caf50',
        red:     '#f44336',
        orange:  '#ff9800',
        blue:    '#2196f3',
      },
    },
  },
  plugins: [],
};
