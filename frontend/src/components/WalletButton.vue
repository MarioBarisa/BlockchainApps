<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWalletStore } from '@/stores/wallet'
import AppIcon from '@/components/AppIcon.vue'

const wallet = useWalletStore()
const route = useRoute()
const dropdown = ref<HTMLDetailsElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

function closeMenu() {
  if (dropdown.value) dropdown.value.open = false
  trigger.value?.focus()
}

function closeOutside(event: PointerEvent) {
  if (event.target instanceof Node && !dropdown.value?.contains(event.target) && dropdown.value) {
    dropdown.value.open = false
  }
}

onMounted(() => document.addEventListener('pointerdown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeOutside))
watch(() => route.fullPath, () => {
  if (dropdown.value) dropdown.value.open = false
})
</script>

<template>
  <!-- Spojeni wallet: gumb za spajanje ili kartica s adresom i saldom -->
  <button
    v-if="!wallet.connected"
    type="button"
    class="header-menu-trigger btn btn-primary btn-sm gap-2 rounded-md"
    :disabled="wallet.connecting || wallet.sending"
    @click="wallet.connect()"
  >
    <span v-if="wallet.connecting" class="loading loading-spinner loading-xs"></span>
    <AppIcon v-else name="wallet" :size="18" />
    <span class="hidden sm:inline">{{ wallet.connecting ? 'Spajam...' : 'Poveži wallet' }}</span>
    <span class="min-w-12 sm:hidden">{{ wallet.connecting ? 'Spajam…' : 'Wallet' }}</span>
  </button>

  <details v-else ref="dropdown" class="dropdown dropdown-end" @keydown.esc.prevent="closeMenu()">
    <summary ref="trigger" class="header-menu-trigger btn btn-outline btn-sm gap-2 rounded-md border-base-300" :aria-label="`Wallet: ${wallet.address}`">
      <span class="size-2 rounded-full" :class="wallet.isSepolia ? 'bg-success' : 'bg-warning'"></span>
      <span class="font-mono text-xs sm:hidden">{{ wallet.address?.slice(0, 4) }}…{{ wallet.address?.slice(-4) }}</span>
      <span class="hidden font-mono text-xs sm:inline">{{ wallet.shortAddress }}</span>
      <AppIcon name="caret-down" :size="14" />
    </summary>
    <ul
      class="dropdown-content header-menu z-50 mt-2 w-64 space-y-2 rounded-md border border-base-300 bg-base-100 p-3 shadow-lg"
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
        <RouterLink to="/profile" class="btn btn-primary btn-sm mb-2 w-full" @click="closeMenu()">Saldo i transakcije</RouterLink>
        <button type="button" class="btn btn-ghost btn-sm w-full justify-start gap-2" :disabled="wallet.sending || wallet.connecting" @click="wallet.disconnect()">
          <AppIcon name="sign-out" :size="18" />
          Odspoji wallet
        </button>
      </li>
    </ul>
  </details>
  <div v-if="wallet.error && !wallet.connected" role="alert" class="wallet-error fixed inset-x-4 top-16 z-50 mx-auto max-w-lg rounded-md border border-error bg-base-100 p-4 text-sm shadow-lg">
    <p>{{ wallet.error }}</p>
    <button type="button" class="btn btn-ghost btn-xs mt-2" @click="wallet.error = ''">Zatvori</button>
  </div>
</template>
