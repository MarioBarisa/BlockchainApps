<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import AppIcon from '@/components/AppIcon.vue'

const theme = useThemeStore()
const dropdown = ref<HTMLDetailsElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

function closeMenu() {
  if (dropdown.value) dropdown.value.open = false
  trigger.value?.focus()
}

function selectTheme(name: string) {
  theme.setTheme(name)
  closeMenu()
}

function closeOutside(event: PointerEvent) {
  if (event.target instanceof Node && !dropdown.value?.contains(event.target) && dropdown.value) {
    dropdown.value.open = false
  }
}

onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <details ref="dropdown" class="dropdown dropdown-end" @keydown.esc.prevent="closeMenu()">
    <summary ref="trigger" class="btn btn-outline btn-sm gap-2 border-base-300 bg-base-100 text-xs" :aria-label="`Tema sučelja: ${theme.mode}`">
      <AppIcon name="palette" :size="16" />
      <span class="hidden w-20 truncate text-left sm:inline">{{ theme.mode }}</span>
      <span :data-theme="theme.mode" class="flex gap-0.5 rounded border border-base-300 bg-base-100 p-1" aria-hidden="true">
        <span class="size-2.5 rounded-xs bg-primary"></span>
        <span class="size-2.5 rounded-xs bg-secondary"></span>
        <span class="size-2.5 rounded-xs bg-accent"></span>
      </span>
      <AppIcon name="caret-down" :size="12" class="hidden sm:block" />
    </summary>
    <div class="dropdown-content z-50 mt-2 w-64 overflow-hidden rounded-lg border border-base-300 bg-base-100 shadow-lg">
      <p class="border-b border-base-300 bg-base-200/60 px-3 py-2 text-xs font-semibold">Tema sučelja <span class="ml-1 font-mono text-base-content/70">{{ theme.themes.length }}</span></p>
      <ul class="max-h-80 space-y-0.5 overflow-y-auto overscroll-contain p-1.5" aria-label="DaisyUI teme">
        <li v-for="name in theme.themes" :key="name">
          <button type="button" class="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs hover:bg-base-200" :class="theme.mode === name ? 'border-primary/40 bg-primary/10 text-primary' : 'border-transparent'" :aria-pressed="theme.mode === name" @click="selectTheme(name)">
            <span :data-theme="name" class="flex shrink-0 gap-1 rounded border border-base-300 bg-base-100 p-1.5" aria-hidden="true">
              <span class="size-3 rounded-xs bg-primary"></span>
              <span class="size-3 rounded-xs bg-secondary"></span>
              <span class="size-3 rounded-xs bg-accent"></span>
              <span class="size-3 rounded-xs bg-base-content"></span>
            </span>
            <span class="flex-1">{{ name }}</span>
            <AppIcon v-if="theme.mode === name" name="check-circle" :size="15" />
          </button>
        </li>
      </ul>
    </div>
  </details>
</template>
