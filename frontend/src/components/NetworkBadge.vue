<script setup lang="ts">
import { appConfig } from '@/config/app'
</script>

<template>
  <span class="badge badge-outline gap-1.5 border-base-300 h-7 font-mono text-[11px]">
    <span class="size-1.5 rounded-full bg-success"></span>
    {{ appConfig.network.name }}
  </span>
</template>
