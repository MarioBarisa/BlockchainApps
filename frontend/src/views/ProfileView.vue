<script setup lang="ts">
import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import AppIcon from '@/components/AppIcon.vue'
import NetworkBadge from '@/components/NetworkBadge.vue'
import { appConfig } from '@/config/app'

const wallet = useWalletStore()

const activity = computed(() => [
  { label: 'Podržao projekt', detail: 'Kolektivna kupnja kave', amount: '0.15 ETH', icon: 'heart' as const },
  { label: 'Novi projekt', detail: 'Kutija za razmjenu knjiga', amount: '0.05 ETH', icon: 'note-pencil' as const },
  { label: 'Primljena donacija', detail: 'Zelena terasa zajednice', amount: '0.08 ETH', icon: 'gift' as const },
])
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-primary">Profil</p>
        <h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Moj prostor</h1>
        <p class="mt-1 text-sm text-base-content/60">
          Tvoja adresa, podrške i projekti koje si predložio.
        </p>
      </div>
      <NetworkBadge />
    </div>

    <div class="mt-6 grid gap-4 lg:grid-cols-3">
      <!-- Kartica walleta -->
      <div class="rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-sm lg:col-span-1">
        <div class="flex items-center gap-3">
          <span class="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
            <AppIcon name="wallet" :size="24" />
          </span>
          <div>
            <p class="text-sm font-bold">Wallet</p>
            <p class="text-xs text-base-content/50">{{ appConfig.network.name }}</p>
          </div>
        </div>

        <!-- Spojeno stanje -->
        <template v-if="wallet.connected">
          <div class="mt-4 rounded-2xl bg-base-200/70 p-4">
            <p class="text-[11px] uppercase tracking-wide text-base-content/50">Adresa</p>
            <p class="mt-1 break-all font-mono text-xs font-semibold">{{ wallet.address }}</p>
            <div class="mt-3 flex items-center justify-between">
              <div>
                <p class="text-[11px] uppercase tracking-wide text-base-content/50">Saldo</p>
                <p class="text-xl font-extrabold">{{ wallet.balance }} ETH</p>
              </div>
              <span class="badge badge-success badge-sm gap-1 font-semibold">
                <AppIcon name="check-circle" :size="12" />
                spojeno
              </span>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm mt-4 w-full gap-2 rounded-xl border border-base-300"
            @click="wallet.disconnect()"
          >
            <AppIcon name="sign-out" :size="18" />
            Odspoji wallet
          </button>
        </template>

        <!-- Nespojeno stanje -->
        <template v-else>
          <div class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-4 text-center">
            <span class="mx-auto grid size-11 place-items-center rounded-2xl bg-base-100 text-base-content/40">
              <AppIcon name="plugs-connected" :size="22" />
            </span>
            <p class="mt-3 text-sm font-semibold">Wallet nije spojen</p>
            <p class="mt-1 text-xs text-base-content/60">
              Spoji wallet da vidiš svoju aktivnost i podrške.
            </p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm mt-4 w-full gap-2 rounded-xl"
            :disabled="wallet.connecting"
            @click="wallet.connect()"
          >
            <span v-if="wallet.connecting" class="loading loading-spinner loading-xs"></span>
            <AppIcon v-else name="wallet" :size="18" />
            {{ wallet.connecting ? 'Spajam...' : 'Poveži wallet' }}
          </button>
        </template>
      </div>

      <!-- Aktivnost -->
      <div class="rounded-3xl border border-base-300/70 bg-base-100 p-5 shadow-sm lg:col-span-2">
        <div class="flex items-center justify-between">
          <h2 class="font-bold">Moja aktivnost</h2>
          <span class="badge badge-ghost badge-sm">{{ wallet.connected ? activity.length : 0 }} zapisa</span>
        </div>

        <div v-if="wallet.connected" class="mt-4 divide-y divide-base-300/60">
          <div v-for="item in activity" :key="item.detail" class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span class="grid size-10 shrink-0 place-items-center rounded-2xl bg-base-200 text-base-content/70">
              <AppIcon :name="item.icon" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ item.label }}</p>
              <p class="truncate text-xs text-base-content/50">{{ item.detail }}</p>
            </div>
            <span class="font-mono text-xs font-semibold text-primary">{{ item.amount }}</span>
          </div>
        </div>

        <!-- Prazno stanje -->
        <div v-else class="mt-4 rounded-2xl border border-dashed border-base-300 bg-base-200/40 px-4 py-10 text-center">
          <span class="mx-auto grid size-11 place-items-center rounded-2xl bg-base-100 text-base-content/40">
            <AppIcon name="heart" :size="22" />
          </span>
          <p class="mt-3 text-sm font-semibold">Još nema aktivnosti</p>
          <p class="mx-auto mt-1 max-w-xs text-xs text-base-content/60">
            Kad podupreš prvi projekt, tvoja povijest će se pojaviti ovdje.
          </p>
          <RouterLink to="/explore" class="btn btn-primary btn-sm mt-4 gap-2 rounded-xl">
            Istraži projekte
            <AppIcon name="arrow-right" :size="16" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Obavijest da su podaci demo -->
    <div class="alert mt-4 rounded-2xl border border-base-300 bg-base-100">
      <AppIcon name="info" :size="20" class="text-base-content/50" />
      <span class="text-sm text-base-content/60">
        Ovo je demo sučelje. Wallet i aktivnost su primjeri i ne šalju stvarne transakcije.
      </span>
    </div>
  </div>
</template>
