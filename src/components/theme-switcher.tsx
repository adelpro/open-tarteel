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
        'flex h-8 w-8 items-center justify-center rounded-full',
        'border transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'border-zinc-200 bg-zinc-100 text-zinc-700 hover:border-zinc-300 hover:bg-white',
        'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700',
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
