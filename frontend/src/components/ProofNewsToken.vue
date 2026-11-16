<script setup lang="ts">
import { ZeroAddress } from 'ethers'
import { useWalletStore } from '@/stores/wallet'

const wallet = useWalletStore()
</script>

<template>
  <section v-if="wallet.networkKey === 'hardhat'" class="app-panel mt-4" :aria-busy="wallet.refreshing" aria-labelledby="pnp-title">
    <div class="panel-heading">
      <h2 id="pnp-title" class="font-semibold">ProofNews Proof · PNP</h2>
      <button type="button" class="btn btn-ghost btn-sm" :disabled="!wallet.connected || !wallet.isCorrectNetwork || wallet.refreshing" @click="wallet.refresh()">Osvježi token</button>
    </div>
    <div class="panel-body">
      <p v-if="!wallet.connected || !wallet.isCorrectNetwork" class="text-sm text-base-content/70">Poveži wallet na Hardhat mreži za prikaz tokena.</p>
      <p v-else-if="wallet.tokenError" role="alert" class="text-sm text-warning">{{ wallet.tokenError }}</p>
      <div v-else-if="wallet.token">
        <div class="grid gap-3 sm:grid-cols-2" role="status">
          <div class="rounded-md border border-base-300 bg-base-200/50 p-4">
            <p class="text-xs text-base-content/70">Tvoj PNP saldo</p>
            <p class="mt-1 break-all font-mono text-2xl font-semibold">{{ wallet.token.balance }} PNP</p>
          </div>
          <div class="rounded-md border border-base-300 bg-base-200/50 p-4">
            <p class="text-xs text-base-content/70">Ukupna ponuda</p>
            <p class="mt-1 break-all font-mono text-2xl font-semibold">{{ wallet.token.totalSupply }} PNP</p>
          </div>
        </div>
        <dl class="mt-4 space-y-3 text-xs">
          <div><dt class="text-base-content/70">Adresa tokena</dt><dd class="mt-1 break-all font-mono">{{ wallet.token.address }}</dd></div>
          <div><dt class="text-base-content/70">Vlasnik ugovora</dt><dd class="mt-1 break-all font-mono">{{ wallet.token.owner }}</dd></div>
          <div><dt class="text-base-content/70">Registar</dt><dd class="mt-1 break-all font-mono">{{ wallet.token.registry === ZeroAddress ? 'Još nije povezan' : wallet.token.registry }}</dd></div>
        </dl>
        <p class="mt-4 text-xs text-base-content/70">PNP nije prenosiv. Nakon same objave saldo i ukupna ponuda su 0. ETH se koristi za mrežne naknade.</p>
      </div>
      <p v-else role="status" class="text-sm text-base-content/70">{{ wallet.refreshing ? 'Učitavam podatke tokena…' : 'Osvježi podatke tokena.' }}</p>
    </div>
  </section>
</template>
