<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p v-if="eyebrow" class="text-xs font-bold uppercase tracking-widest text-primary">{{ eyebrow }}</p>
      <h2 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{{ title }}</h2>
      <p v-if="description" class="mt-1 max-w-2xl text-sm text-base-content/60">{{ description }}</p>
    </div>
    <slot name="action" />
  </div>
</template>
