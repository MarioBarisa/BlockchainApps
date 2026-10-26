import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import themeNames from 'daisyui/functions/themeOrder'

const STORAGE_KEY = 'tbd-theme'

export const useThemeStore = defineStore('theme', () => {
  function readInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && themeNames.includes(saved)) return saved
    } catch {
      // Tema radi i kad preglednik blokira pohranu.
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dracula' : 'light'
  }

  const mode = ref(readInitialTheme())

  function applyTheme() {
    const root = document.documentElement
    root.dataset.theme = mode.value
    const background = getComputedStyle(root).getPropertyValue('--color-base-100').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
  }

  function setTheme(name: string) {
    if (themeNames.includes(name)) mode.value = name
  }

  watch(mode, () => {
    applyTheme()
    try {
      localStorage.setItem(STORAGE_KEY, mode.value)
    } catch {
      // Odabir ostaje aktivan tijekom ove sesije.
    }
  }, { flush: 'sync' })

  return { mode, themes: themeNames, setTheme, init: applyTheme }
})
