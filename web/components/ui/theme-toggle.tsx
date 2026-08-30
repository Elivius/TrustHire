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
      className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-foreground/75 hover:text-foreground transition-all"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-indigo-400" />}
    </button>
  );
};
