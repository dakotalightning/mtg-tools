/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Card Cloud — Workshop palette
        ink: '#202a30',
        muted: '#626b6e',
        canvas: '#f4f1ea',
        paper: '#fffdf8',
        line: '#dedbd2',
        night: '#172329',
        brass: '#a97731',
        gold: '#e5bd78',
        azure: '#30688c',
        forest: '#3e6f57',
        rust: '#9c4f42',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
    },
  },
  plugins: [],
}
