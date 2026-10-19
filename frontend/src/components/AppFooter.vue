<script setup lang="ts">
import { appConfig } from '@/config/app'
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <footer class="mt-16 border-t border-base-300/60 bg-base-200/50">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-base-content/60 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div class="flex items-center gap-2">
        <span class="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary">
          <AppIcon name="sparkle" :size="18" />
        </span>
        <span>
          <strong class="text-base-content">{{ appConfig.name }}</strong> · {{ appConfig.community }}
        </span>
      </div>
      <p class="text-xs">
        Demo sučelje · mreža {{ appConfig.network.name }} · podaci na stranici su primjeri
      </p>
    </div>
  </footer>
</template>
