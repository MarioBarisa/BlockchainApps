<script setup lang="ts">
import { appConfig } from '@/config/app'
</script>

<template>
  <span class="badge badge-outline gap-1.5 border-base-300 py-3 font-medium">
    <span class="size-2 rounded-full bg-success"></span>
    {{ appConfig.network.name }}
  </span>
</template>
