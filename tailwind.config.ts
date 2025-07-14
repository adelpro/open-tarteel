import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import animated from 'tailwindcss-animated';

const config: Config = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        'brand-dark-100': '#f5f6f7',
        'brand-CTA-dark-200': '#e5e7eb',
        'brand-CTA-dark-500': '#6B7280',
        'brand-CTA-dark-600': '#222222',
        'brand-CTA-blue-500': '#3B82F6',
        'brand-CTA-blue-600': '#2363eb',
        'brand-CTA-green-500': '#10B981',
        'brand-CTA-green-600': '#059669',
        'brand-CTA-red-500': '#FF4B4B',
        'brand-CTA-red-600': '#DB2727',
        'brand-success': '#4BB543',
        'brand-info': '#4D71F9',
        'brand-warning': '#FFA800',
        'brand-danger': '#FF4B4B',
      },
    },
    keyframes: {
      slideIn: {
        '0%': { transform: 'translateY(-100%)' },
        '100%': { transform: 'translateY(0)' },
      },
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      appear: {
        from: {
          opacity: '0',
          transform: 'translateY(4rem)',
        },
        to: {
          opacity: '1',
          transform: 'translateY(0%)',
        },
      },
    },
    animation: {
      slideIn: 'slideIn 0.2s ease-out',
      fadeIn: 'fadeIn 0.4s ease-out',
      slideInWithFade: 'slideIn 0.2s ease-out, fadeIn 0.5s ease-out',
    },
  },
  plugins: [forms, animated, typography],
};

export default config;
