<script setup lang="ts">
import { useWalletStore } from '@/stores/wallet'
import AppIcon from '@/components/AppIcon.vue'

const wallet = useWalletStore()
</script>

<template>
  <!-- Spojeni wallet: gumb za spajanje ili kartica s adresom i saldom -->
  <button
    v-if="!wallet.connected"
    type="button"
    class="btn btn-primary btn-sm gap-2 rounded-xl sm:btn-md"
    :disabled="wallet.connecting"
    @click="wallet.connect()"
  >
    <span v-if="wallet.connecting" class="loading loading-spinner loading-xs"></span>
    <AppIcon v-else name="wallet" :size="18" />
    <span class="hidden sm:inline">{{ wallet.connecting ? 'Spajam...' : 'Poveži wallet' }}</span>
    <span class="sm:hidden">{{ wallet.connecting ? '...' : 'Wallet' }}</span>
  </button>

  <div v-else class="dropdown dropdown-end">
    <button tabindex="0" type="button" class="btn btn-outline btn-sm gap-2 rounded-xl border-base-300 sm:btn-md">
      <span class="size-2 rounded-full bg-success"></span>
      <span class="font-mono text-xs sm:text-sm">{{ wallet.shortAddress }}</span>
      <AppIcon name="caret-down" :size="14" />
    </button>
    <ul
      tabindex="0"
      class="dropdown-content z-50 mt-2 w-64 space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-xl"
    >
      <li class="flex items-center justify-between text-sm">
        <span class="text-base-content/60">Mreža</span>
        <span class="font-semibold">Sepolia</span>
      </li>
      <li class="flex items-center justify-between text-sm">
        <span class="text-base-content/60">Saldo</span>
        <span class="font-semibold">{{ wallet.balance }} ETH</span>
      </li>
      <li>
        <button type="button" class="btn btn-ghost btn-sm w-full justify-start gap-2" @click="wallet.disconnect()">
          <AppIcon name="sign-out" :size="18" />
          Odspoji wallet
        </button>
      </li>
    </ul>
  </div>
</template>
