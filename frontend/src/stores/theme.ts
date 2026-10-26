import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import themeNames from 'daisyui/functions/themeOrder'

const STORAGE_KEY = 'tbd-theme'

export const useThemeStore = defineStore('theme', () => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const systemDark = ref(media.matches)
  let initialized = false

  function readPreference() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && themeNames.includes(saved)) return saved
    } catch {
      // Tema radi i kad preglednik blokira pohranu.
    }
    return 'system'
  }

  const preference = ref(readPreference())
  const systemTheme = computed(() => systemDark.value ? 'dark' : 'light')
  const mode = computed(() => preference.value === 'system' ? systemTheme.value : preference.value)

  function applyTheme() {
    const root = document.documentElement
    root.dataset.theme = mode.value
    const background = getComputedStyle(root).getPropertyValue('--color-base-100').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', background)
  }

  function setTheme(name: string) {
    if (name === 'system' || themeNames.includes(name)) preference.value = name
  }

  function handleSystemChange(event: MediaQueryListEvent) {
    systemDark.value = event.matches
  }

  function init() {
    if (!initialized) {
      media.addEventListener('change', handleSystemChange)
      initialized = true
    }
    systemDark.value = media.matches
    applyTheme()
  }

  watch(mode, applyTheme, { flush: 'sync' })
  watch(preference, () => {
    try {
      if (preference.value === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, preference.value)
    } catch {
      // Odabir ostaje aktivan tijekom ove sesije.
    }
  }, { flush: 'sync' })

  onScopeDispose(() => {
    if (initialized) media.removeEventListener('change', handleSystemChange)
  })

  return { mode, preference, systemTheme, themes: themeNames, setTheme, init }
})
