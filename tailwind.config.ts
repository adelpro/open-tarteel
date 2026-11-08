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
        card: 'var(--card)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        // Semantic aliases used by new components (DESIGN.md).
        canvas: 'var(--background)',
        ink: 'var(--foreground)',
        'ink-muted': 'var(--muted)',
        'ink-subtle': 'var(--foreground-subtle)',
        'surface-raised': 'var(--surface-raised)',
        'surface-sunken': 'var(--surface-sunken)',
        'border-strong': 'var(--border-strong)',
        primary: 'var(--accent)',
        'primary-hover': 'var(--accent-hover)',
        'primary-soft': 'var(--accent-soft)',
        'primary-line': 'var(--accent-line)',
        'on-primary': 'var(--on-primary)',
        mark: 'var(--mark)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
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
      },
      borderRadius: {
        control: '10px',
        row: '12px',
        card: '16px',
        sheet: '20px',
      },
      transitionDuration: {
        '120': '120ms',
        '180': '180ms',
        '240': '240ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
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
      spinOnce: {
        '0%': { transform: 'rotate(0deg)', opacity: '0' },
        '50%': { opacity: '0.5' },
        '100%': { transform: 'rotate(180deg)', opacity: '1' },
      },
    },
    animation: {
      slideIn: 'slideIn 300ms ease-out',
      fadeIn: 'fadeIn 0.4s ease-out',
      slideInWithFade: 'slideIn 0.2s ease-out, fadeIn 0.5s ease-out',
      appear: 'appear 0.5s ease-in-out',
      spinOnce: 'spinOnce 0.5s ease-in-out',
    },
  },
  plugins: [forms, animated, typography],
};

export default config;
