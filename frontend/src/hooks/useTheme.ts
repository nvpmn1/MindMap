// ============================================================================
// MindMap Hub - Theme Hook
// ============================================================================
// Hook para gerenciar tema da aplicação (light/dark/system)
// ============================================================================

import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'mindmap-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem(THEME_KEY) as Theme) || 'system'
  })

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Get resolved theme (actual theme being applied)
  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    : theme

  return {
    theme,
    setTheme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark'
  }
}

export default useTheme
