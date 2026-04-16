"use client";

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "billit_theme_preference";

export function useDarkMode() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    setMounted(true);

    // Get saved preference or default to system
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const preference = saved || "system";
    setTheme(preference);

    // Apply theme
    applyTheme(preference);
  }, []);

  const applyTheme = (themeMode: ThemeMode) => {
    const html = document.documentElement;
    let isDark = false;

    if (themeMode === "dark") {
      isDark = true;
    } else if (themeMode === "light") {
      isDark = false;
    } else {
      // System preference
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    if (isDark) {
      html.classList.add("dark");
      html.style.colorScheme = "dark";
    } else {
      html.classList.remove("dark");
      html.style.colorScheme = "light";
    }
  };

  const setDarkMode = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    applyTheme(mode);
  };

  return {
    theme,
    setTheme: setDarkMode,
    isDark:
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
    mounted,
  };
}

// Listen to system theme changes
export function useSystemThemeListener() {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as
        | ThemeMode
        | null;

      // Only apply system theme if user selected "system"
      if (saved === "system" || !saved) {
        const html = document.documentElement;
        if (e.matches) {
          html.classList.add("dark");
          html.style.colorScheme = "dark";
        } else {
          html.classList.remove("dark");
          html.style.colorScheme = "light";
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
}
