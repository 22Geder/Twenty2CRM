"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/lib/use-theme"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all ${className}`}
      title={isDark ? "מצב בהיר" : "מצב כהה"}
      aria-label={isDark ? "עבור למצב בהיר" : "עבור למצב כהה"}
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] text-amber-400" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </button>
  )
}
