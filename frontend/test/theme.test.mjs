import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { createPinia, setActivePinia } from 'pinia'
import { moduleUrl } from './moduleUrl.mjs'

const { useThemeStore } = await import(moduleUrl('../src/stores/theme.ts'))
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const bootScript = html.match(/<script>([\s\S]*?)<\/script>/)[1]
const names = ['window', 'document', 'localStorage', 'getComputedStyle']
const originals = names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)])
let media, storage, listeners, blocked, theme

function start() {
  theme = useThemeStore()
  theme.init()
  return theme
}

beforeEach(() => {
  theme = null
  blocked = false
  storage = new Map()
  listeners = new Map()
  media = {
    matches: false,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
  }
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: { matchMedia: () => media } },
    document: { configurable: true, value: { documentElement: { dataset: {} }, querySelector: () => null } },
    localStorage: { configurable: true, value: {
      getItem: (key) => { if (blocked) throw new Error('Pohrana blokirana'); return storage.get(key) ?? null },
      setItem: (key, value) => { if (blocked) throw new Error('Pohrana blokirana'); storage.set(key, value) },
      removeItem: (key) => { if (blocked) throw new Error('Pohrana blokirana'); storage.delete(key) },
    } },
    getComputedStyle: { configurable: true, value: () => ({ getPropertyValue: () => '#ffffff' }) },
  })
  setActivePinia(createPinia())
})

afterEach(() => {
  theme?.$dispose()
  for (const [name, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else delete globalThis[name]
  }
})

test('automatska svijetla tema je garden', () => {
  assert.equal(start().mode, 'garden')
  assert.equal(globalThis.document.documentElement.dataset.theme, 'garden')
})

test('automatska tamna tema je forest', () => {
  media.matches = true
  assert.equal(start().mode, 'forest')
  assert.equal(globalThis.document.documentElement.dataset.theme, 'forest')
})

test('promjena sustava mijenja automatsku temu i cisti listener pri gasenju storea', () => {
  start()
  media.matches = true
  listeners.get('change')({ matches: true })
  assert.equal(theme.mode, 'forest')
  listeners.get('change')({ matches: false })
  assert.equal(theme.mode, 'garden')
  theme.$dispose()
  assert.equal(listeners.size, 0)
})

test('rucni odabir ostaje sacuvan do ponovnog odabira Automatski', () => {
  storage.set('tbd-theme', 'cupcake')
  start()
  listeners.get('change')({ matches: true })
  assert.equal(theme.mode, 'cupcake')
  theme.setTheme('system')
  assert.equal(theme.mode, 'forest')
  assert.equal(storage.has('tbd-theme'), false)
})

test('tema radi i kada je lokalna pohrana blokirana', () => {
  blocked = true
  start()
  assert.equal(theme.mode, 'garden')
  theme.setTheme('forest')
  assert.equal(theme.mode, 'forest')
})

test('pocetna HTML skripta koristi iste automatske teme prije pokretanja Vuea', () => {
  runInNewContext(bootScript, { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage })
  assert.equal(globalThis.document.documentElement.dataset.theme, 'garden')
  media.matches = true
  runInNewContext(bootScript, { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage })
  assert.equal(globalThis.document.documentElement.dataset.theme, 'forest')
  storage.set('tbd-theme', 'dark')
  runInNewContext(bootScript, { window: globalThis.window, document: globalThis.document, localStorage: globalThis.localStorage })
  assert.equal(globalThis.document.documentElement.dataset.theme, 'dark')
})
