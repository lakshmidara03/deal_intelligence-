import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        paper: '#F7F5EF',
        line: '#D9D4C7',
        mint: '#BFE3D0',
        coral: '#EA7A64',
        gold: '#D7A73E'
      }
    }
  },
  plugins: []
};

export default config;
