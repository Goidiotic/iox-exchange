export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#05070b',
        panel: '#0a1118',
        line: 'rgba(148, 163, 184, 0.14)',
        acid: '#31f59f',
        cyanx: '#35c7ff',
        warn: '#f6c453',
      },
      boxShadow: {
        glow: '0 0 36px rgba(49, 245, 159, 0.16)',
        blue: '0 0 38px rgba(53, 199, 255, 0.16)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
