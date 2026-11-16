<script setup lang="ts">
import { ref, watch } from 'vue'
import { networks, type NetworkKey } from '@/config/networks'
import { useWalletStore } from '@/stores/wallet'

const wallet = useWalletStore()
const choice = ref<NetworkKey>(wallet.networkKey)
watch(() => wallet.networkKey, (value) => { choice.value = value })
</script>

<template>
  <form class="app-panel mt-4 p-4" aria-labelledby="network-title" @submit.prevent="wallet.selectNetwork(choice)">
    <fieldset :disabled="wallet.connecting || wallet.sending">
      <legend id="network-title" class="text-sm font-semibold">Odaberi mrežu</legend>
      <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        <label v-for="(item, key) in networks" :key="key" :for="`network-${key}`" class="flex min-h-12 cursor-pointer items-center gap-2 text-sm">
          <input :id="`network-${key}`" v-model="choice" class="radio radio-primary radio-sm" type="radio" name="network" :value="key" />
          {{ item.name }}
        </label>
        <button type="submit" class="btn btn-outline min-h-12 rounded-md">
          {{ wallet.connecting ? 'Mijenjam mrežu…' : 'Potvrdi mrežu' }}
        </button>
      </div>
    </fieldset>
    <p role="status" class="mt-2 text-xs text-base-content/70">Odabrano: {{ wallet.network.name }}. {{ wallet.connected ? `Wallet: ${wallet.actualNetworkName}.` : 'Zatim poveži wallet.' }}</p>
    <p v-if="wallet.networkKey === 'hardhat'" class="mt-2 text-xs text-base-content/70">Za lokalni rad pokreni Hardhat čvor i objavi token. Dodavanje mreže potvrđuješ u walletu.</p>
  </form>
</template>
