<script setup lang="ts">
import { useWalletStore } from '@/stores/wallet'
const wallet = useWalletStore()
</script>

<template>
  <span class="badge badge-outline gap-1.5 border-base-300 h-7 font-mono text-[11px]">
    <span class="size-1.5 rounded-full" :class="wallet.isCorrectNetwork ? 'bg-success' : 'bg-base-content/40'"></span>
    {{ wallet.network.name }}
  </span>
</template>
