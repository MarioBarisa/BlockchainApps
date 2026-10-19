import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'tbd-theme'

// Boja adresne trake na mobitelu (meta theme-color ne prima oklch)
const THEME_COLORS: Record<ThemeMode, string> = {
  light: '#ffffff',
  dark: '#1d232a',
}

export const useThemeStore = defineStore('theme', () => {
  // Ako korisnik nije odabrao temu, pratimo postavku uredaja
  function readInitialMode(): ThemeMode {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const mode = ref<ThemeMode>(readInitialMode())
  const isDark = computed(() => mode.value === 'dark')

  function applyTheme() {
    document.documentElement.dataset.theme = mode.value
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[mode.value])
  }

  function init() {
    applyTheme()
  }

  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  watch(mode, () => {
    localStorage.setItem(STORAGE_KEY, mode.value)
    applyTheme()
  })

  return { mode, isDark, init, toggle }
})
