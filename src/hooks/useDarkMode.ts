import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  // Read preference immediately (no flash)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dark_mode');
      if (stored !== null) return stored === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('dark_mode', nextDark.toString());
  };

  return { isDark, toggle };
};