<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { icons, type IconName } from '@/icons'

defineProps<{
  name: IconName
  size?: number | string
}>()
</script>

<template>
  <Icon :icon="icons[name]" :width="size ?? 20" :height="size ?? 20" aria-hidden="true" />
</template>
