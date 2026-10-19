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
    class="group flex h-full flex-col rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
  >
    <div class="flex items-start justify-between gap-3">
      <span class="grid size-12 place-items-center rounded-2xl bg-secondary/15 text-secondary">
        <AppIcon :name="project.icon" :size="24" />
      </span>
      <span class="badge badge-ghost badge-sm font-semibold">{{ project.category }}</span>
    </div>

    <h3 class="mt-4 text-lg font-bold leading-snug">{{ project.title }}</h3>
    <p class="mt-1 flex-1 text-sm text-base-content/60">{{ project.description }}</p>

    <div class="mt-4">
      <div class="mb-1.5 flex items-baseline justify-between text-sm">
        <span class="font-bold">{{ project.raised }} ETH</span>
        <span class="text-xs text-base-content/50">cilj {{ project.goal }} ETH</span>
      </div>
      <progress class="progress progress-primary h-2 w-full" :value="progress" max="100"></progress>
      <div class="mt-2 flex items-center justify-between text-xs text-base-content/50">
        <span class="inline-flex items-center gap-1">
          <AppIcon name="users-three" :size="14" />
          {{ project.supporters }} podupiratelja
        </span>
        <span class="font-semibold text-primary">{{ progress }}%</span>
      </div>
    </div>
  </article>
</template>
