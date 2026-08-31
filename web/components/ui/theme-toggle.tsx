"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useApp } from "@/context/app-context";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useApp();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-xl border border-black/15 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:border-black/25 text-foreground/80 hover:text-foreground transition-all shadow-sm dark:shadow-none cursor-pointer"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
    </button>
  );
};
