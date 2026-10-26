<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { IconName } from '@/icons'

defineProps<{
  title: string
  value: string
  hint: string
  icon: IconName
}>()
</script>

<template>
  <div class="app-panel p-4">
    <div class="flex items-center gap-3">
      <span class="grid size-9 place-items-center rounded-md bg-primary/12 text-primary">
        <AppIcon :name="icon" :size="18" />
      </span>
      <div>
        <p class="font-mono text-xl font-semibold leading-none tabular-nums">{{ value }}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-base-content/65">{{ title }}</p>
      </div>
    </div>
    <p class="mt-2 text-xs text-base-content/70">{{ hint }}</p>
  </div>
</template>
