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
    // Only the three loaded Tajawal weights exist. `font-normal`,
    // `font-medium` and `font-semibold` are deliberately absent (DESIGN.md).
    fontWeight: {
      regular: '400',
      bold: '700',
      black: '900',
    },
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
        // `--accent` is a CSS variable (three palettes × two modes), so it
        // cannot be split into Tailwind's `rgb(... / <alpha>)` channels. The
        // `<alpha-value>` placeholder lets `primary/35` tint the live token.
        primary: 'color-mix(in srgb, var(--accent) calc(<alpha-value> * 100%), transparent)',
        'primary-hover': 'var(--accent-hover)',
        'primary-soft': 'var(--accent-soft)',
        'primary-line': 'var(--accent-line)',
        'on-primary': 'var(--on-primary)',
        mark: 'var(--mark)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        scrim: 'var(--scrim)',
      },
      // 4px vertical rhythm from DESIGN.md. `extend` keeps Tailwind's
      // numeric scale (p-2, gap-4, ...) intact alongside the named steps.
      spacing: {
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        '5xl': '64px',
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
        // Bare `transition-*` utilities use the standard easing too, so every
        // default transition follows the motion token (DESIGN.md).
        DEFAULT: 'cubic-bezier(0.2, 0, 0, 1)',
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
