'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';

import { themeAtom } from '@/jotai/atom';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useAtom(themeAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    let currentTheme = theme;
    if (currentTheme === 'system') {
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    const cl = document.documentElement.classList;
    if (newTheme === 'dark') {
      cl.add('dark');
      cl.remove('light');
    } else {
      cl.add('light');
      cl.remove('dark');
    }
  };

  if (!mounted) {
    return <div className="h-8 w-8 flex-shrink-0 rounded-full" />;
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'z-50 flex h-8 w-8 items-center justify-center rounded-full',
        'border border-gray-300 bg-white text-sm font-semibold text-gray-600 shadow-sm',
        'transition-all duration-200 hover:bg-gray-50 hover:text-gray-900',
        'focus:outline-none focus:ring-brand-CTA-blue-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100',
      ].join(' ')}
    >
      {isDark ? (
        <BsMoonStarsFill className="h-3.5 w-3.5 text-sky-400" />
      ) : (
        <BsSunFill className="h-4 w-4 text-amber-500" />
      )}
    </button>
  );
}
