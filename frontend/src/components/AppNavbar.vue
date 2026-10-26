<script setup lang="ts">
import { appConfig } from '@/config/app'
import AppIcon from '@/components/AppIcon.vue'
import NetworkBadge from '@/components/NetworkBadge.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import WalletButton from '@/components/WalletButton.vue'

const links = [
  { to: '/', label: 'Početna' },
  { to: '/explore', label: 'Istraži' },
  { to: '/profile', label: 'Profil' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-base-300 bg-base-100 shadow-sm">
    <div class="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-primary">
        <span class="grid size-8 place-items-center rounded-md bg-primary text-primary-content">
          <AppIcon name="sparkle" :size="18" />
        </span>
        <span class="flex flex-col leading-none">
          <span class="text-base font-semibold tracking-tight">{{ appConfig.name }}</span>
          <span class="hidden text-[11px] font-medium text-base-content/70 sm:block">
            {{ appConfig.community }}
          </span>
        </span>
      </RouterLink>

      <!-- Desktop navigacija -->
      <nav class="ml-6 hidden items-center gap-1 md:flex" aria-label="Glavna navigacija">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-md border border-transparent px-3 py-1.5 text-sm font-semibold text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
          exact-active-class="border-base-300 bg-base-200 text-base-content"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-1.5">
        <NetworkBadge class="hidden sm:inline-flex" />
        <ThemeSelector />
        <WalletButton />
      </div>
    </div>
  </header>
</template>
