"use client";

import { useSystemThemeListener } from "@/lib/hooks/use-dark-mode";
import { useEffect } from "react";

export function ThemeInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize theme on first mount
  useEffect(() => {
    const saved = localStorage.getItem("billit_theme_preference") as
      | "light"
      | "dark"
      | "system"
      | null;
    const preference = saved || "system";

    const html = document.documentElement;
    let isDark = false;

    if (preference === "dark") {
      isDark = true;
    } else if (preference === "light") {
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
  }, []);

  // Listen to system theme changes
  useSystemThemeListener();

  return <>{children}</>;
}
