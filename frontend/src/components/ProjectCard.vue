<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import type { Project } from '@/data/mockProjects'

const props = defineProps<{
  project: Project
}>()

// Postotak napredovanja ogranicen na 0-100
const progress = computed(() => {
  const value = Math.round((props.project.raised / props.project.goal) * 100)
  return Math.min(100, Math.max(0, value))
})
</script>

<template>
  <article
    class="app-panel flex h-full flex-col p-4"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="grid size-8 place-items-center rounded-md bg-secondary/15 text-secondary">
        <AppIcon :name="project.icon" :size="18" />
      </span>
      <span class="badge badge-ghost badge-sm font-semibold">{{ project.category }}</span>
    </div>

    <h3 class="mt-3 text-sm font-bold leading-snug">{{ project.title }}</h3>
    <p class="mt-1 flex-1 text-sm text-base-content/70">{{ project.description }}</p>

    <div class="mt-3 border-t border-base-300 pt-3">
      <div class="mb-1.5 flex items-baseline justify-between text-sm">
        <span class="font-mono font-semibold tabular-nums">{{ project.raised }} ETH</span>
        <span class="text-xs text-base-content/65">cilj {{ project.goal }} ETH</span>
      </div>
      <progress class="progress progress-primary h-1.5 w-full" :value="progress" max="100"></progress>
      <div class="mt-2 flex items-center justify-between text-xs text-base-content/65">
        <span class="inline-flex items-center gap-1">
          <AppIcon name="users-three" :size="14" />
          {{ project.supporters }} podupiratelja
        </span>
        <span class="font-mono font-semibold text-primary">{{ progress }}%</span>
      </div>
    </div>
  </article>
</template>
