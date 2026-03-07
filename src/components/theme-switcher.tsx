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

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return <div className="h-10 w-10 flex-shrink-0" />;
  }

  // To properly show the icon based on actual applied theme (if system)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-gray-200 text-gray-900 transition-all duration-200 hover:scale-105 hover:bg-gray-400/70 focus:outline-none focus:ring-2 focus:ring-brand-CTA-blue-500 dark:border-gray-600 dark:bg-gray-600/60 dark:text-gray-100 dark:hover:bg-gray-600/80"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <BsMoonStarsFill className="h-4 w-4" />
      ) : (
        <BsSunFill className="h-5 w-5 text-slate-800" />
      )}
    </button>
  );
}
