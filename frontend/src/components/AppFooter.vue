<script setup lang="ts">
import { appConfig } from '@/config/app'
import { useWalletStore } from '@/stores/wallet'
import AppIcon from '@/components/AppIcon.vue'
const wallet = useWalletStore()
</script>

<template>
  <footer class="mt-6 border-t border-base-300 bg-base-100">
    <div
      class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-base-content/70 sm:flex-row sm:items-center sm:justify-between sm:px-6"
    >
      <div class="flex items-center gap-2">
        <span class="grid size-6 place-items-center rounded-md bg-primary/15 text-primary">
          <AppIcon name="sparkle" :size="14" />
        </span>
        <span>
          <strong class="text-base-content">{{ appConfig.name }}</strong> · {{ appConfig.community }}
        </span>
      </div>
      <p class="text-xs">
        Mreža {{ wallet.network.name }} · projekti su primjeri, wallet podaci čitaju se s mreže
      </p>
    </div>
  </footer>
</template>
