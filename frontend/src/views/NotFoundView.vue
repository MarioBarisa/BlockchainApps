<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
    <span class="grid size-16 place-items-center rounded-lg bg-primary/12 text-primary">
      <AppIcon name="compass" :size="30" />
    </span>
    <p class="mt-6 text-xs font-bold uppercase tracking-wide text-primary">404</p>
    <h1 class="mt-1 text-3xl font-semibold tracking-tight">Stranica nije pronađena</h1>
    <p class="mt-2 text-sm text-base-content/70">
      Možda je link zastario ili je stranica premještena.
    </p>
    <RouterLink to="/" class="btn btn-primary mt-6 gap-2 rounded-md">
      <AppIcon name="house" :size="18" />
      Natrag na početnu
    </RouterLink>
  </div>
</template>
