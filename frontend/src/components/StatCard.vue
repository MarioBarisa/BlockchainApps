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
  <div class="rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-sm">
    <div class="flex items-center gap-3">
      <span class="grid size-11 place-items-center rounded-2xl bg-primary/12 text-primary">
        <AppIcon :name="icon" :size="22" />
      </span>
      <div>
        <p class="text-2xl font-extrabold leading-none">{{ value }}</p>
        <p class="mt-1 text-xs font-semibold uppercase tracking-wide text-base-content/50">{{ title }}</p>
      </div>
    </div>
    <p class="mt-3 text-sm text-base-content/60">{{ hint }}</p>
  </div>
</template>
