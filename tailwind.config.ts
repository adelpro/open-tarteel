import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import animated from 'tailwindcss-animated';

const config: Config = {
  mode: 'jit',
  darkMode: ['class', 'class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        'brand-dark-100': '#f5f6f7',
        'brand-CTA-dark-200': '#e5e7eb',
        'brand-CTA-dark-500': '#6B7280',
        'brand-CTA-dark-600': '#222222',
        'brand-CTA-blue-500': '#0190dd',
        'brand-CTA-blue-600': '#07507f',
        'brand-CTA-green-500': '#10B981',
        'brand-CTA-green-600': '#059669',
        'brand-CTA-red-500': '#FF4B4B',
        'brand-CTA-red-600': '#DB2727',
        'brand-success': '#4BB543',
        'brand-info': '#4D71F9',
        'brand-warning': '#FFA800',
        'brand-danger': '#FF4B4B',
        'player-stroke': 'var(--player-stroke-color)',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        slideIn: {
          '0%': {
            transform: 'translateY(-100%)',
          },
          '100%': {
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
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
        spinOnce: {
          '0%': {
            transform: 'rotate(0deg)',
            opacity: '0',
          },
          '50%': {
            opacity: '0.5',
          },
          '100%': {
            transform: 'rotate(180deg)',
            opacity: '1',
          },
        },
      },
      animation: {
        slideIn: 'slideIn 300ms ease-out',
        fadeIn: 'fadeIn 0.4s ease-out',
        slideInWithFade: 'slideIn 0.2s ease-out, fadeIn 0.5s ease-out',
        appear: 'appear 0.5s ease-in-out',
        spinOnce: 'spinOnce 0.5s ease-in-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [forms, animated, typography],
};

export default config;
