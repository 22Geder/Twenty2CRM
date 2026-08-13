"use client"

import { useEffect, useState, useCallback } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "dark" || stored === "light") return stored
  } catch {
    // localStorage לא זמין — נחזור לברירת מחדל
  }
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}

/**
 * Hook גלובלי לניהול מצב יום/לילה.
 * נשמר ב-localStorage, מוחל על <html>, ומסונכרן בין כל הרכיבים והטאבים.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light")

  useEffect(() => {
    setThemeState(getInitialTheme())
  }, [])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // מתעלמים אם localStorage חסום
    }
    window.dispatchEvent(new CustomEvent("themechange", { detail: next }))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  useEffect(() => {
    function sync(e: Event) {
      const detail = (e as CustomEvent).detail as Theme | undefined
      if (detail === "dark" || detail === "light") {
        setThemeState(detail)
      } else {
        setThemeState(getInitialTheme())
      }
    }
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        const next = getInitialTheme()
        applyTheme(next)
        setThemeState(next)
      }
    }
    window.addEventListener("themechange", sync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("themechange", sync)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" }
}
