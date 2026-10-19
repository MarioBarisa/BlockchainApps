<script setup lang="ts">
import AppIcon from '@/components/AppIcon.vue'
import type { IconName } from '@/icons'

const items: Array<{ to: string; label: string; icon: IconName }> = [
  { to: '/', label: 'Početna', icon: 'house' },
  { to: '/explore', label: 'Istraži', icon: 'compass' },
  { to: '/profile', label: 'Profil', icon: 'user' },
]
</script>

<template>
  <!-- Donja navigacija samo na mobitelu; od md nav gore preuzima navbar -->
  <nav class="dock md:hidden" aria-label="Mobilna navigacija">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="text-base-content/60"
      active-class="text-primary"
    >
      <AppIcon :name="item.icon" :size="24" />
      <span class="dock-label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
