<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import AppIcon from '@/components/AppIcon.vue'

const theme = useThemeStore()
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost btn-circle"
    :aria-label="theme.isDark ? 'Uključi svijetlu temu' : 'Uključi tamnu temu'"
    :title="theme.isDark ? 'Svijetla tema' : 'Tamna tema'"
    @click="theme.toggle()"
  >
    <AppIcon :name="theme.isDark ? 'sun' : 'moon'" :size="20" />
  </button>
</template>
