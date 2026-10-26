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
    class="btn btn-primary btn-sm gap-2 rounded-md"
    :disabled="wallet.connecting || wallet.sending"
    @click="wallet.connect()"
  >
    <span v-if="wallet.connecting" class="loading loading-spinner loading-xs"></span>
    <AppIcon v-else name="wallet" :size="18" />
    <span class="hidden sm:inline">{{ wallet.connecting ? 'Spajam...' : 'Poveži wallet' }}</span>
    <span class="sm:hidden">{{ wallet.connecting ? '...' : 'Wallet' }}</span>
  </button>

  <div v-else class="dropdown dropdown-end">
    <button tabindex="0" type="button" class="btn btn-outline btn-sm gap-2 rounded-md border-base-300">
      <span class="size-2 rounded-full" :class="wallet.isSepolia ? 'bg-success' : 'bg-warning'"></span>
      <span class="font-mono text-xs sm:text-sm">{{ wallet.shortAddress }}</span>
      <AppIcon name="caret-down" :size="14" />
    </button>
    <ul
      tabindex="0"
      class="dropdown-content z-50 mt-2 w-64 space-y-2 rounded-md border border-base-300 bg-base-100 p-3 shadow-lg"
    >
      <li class="flex items-center justify-between text-sm">
        <span class="text-base-content/70">Mreža</span>
        <span class="font-semibold">{{ wallet.isSepolia ? 'Sepolia' : 'Druga mreža' }}</span>
      </li>
      <li class="flex items-center justify-between text-sm">
        <span class="text-base-content/70">Saldo</span>
        <span class="ml-2 min-w-0 break-all text-right font-semibold">{{ wallet.balance }} ETH</span>
      </li>
      <li>
        <RouterLink to="/profile" class="btn btn-primary btn-sm mb-2 w-full">Saldo i transakcije</RouterLink>
        <button type="button" class="btn btn-ghost btn-sm w-full justify-start gap-2" :disabled="wallet.sending || wallet.connecting" @click="wallet.disconnect()">
          <AppIcon name="sign-out" :size="18" />
          Odspoji wallet
        </button>
      </li>
    </ul>
  </div>
  <div v-if="wallet.error && !wallet.connected" role="alert" class="fixed inset-x-4 top-16 z-50 mx-auto max-w-lg rounded-md border border-error bg-base-100 p-4 text-sm shadow-lg">
    <p>{{ wallet.error }}</p>
    <button type="button" class="btn btn-ghost btn-xs mt-2" @click="wallet.error = ''">Zatvori</button>
  </div>
</template>
