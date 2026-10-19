<script setup lang="ts">
import { appConfig } from '@/config/app'
import AppIcon from '@/components/AppIcon.vue'
import NetworkBadge from '@/components/NetworkBadge.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import WalletButton from '@/components/WalletButton.vue'

const links = [
  { to: '/', label: 'Početna' },
  { to: '/explore', label: 'Istraži' },
  { to: '/profile', label: 'Profil' },
]
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-base-300/60 bg-base-100/85 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2 rounded-2xl focus-visible:outline-2 focus-visible:outline-primary">
        <span class="grid size-10 place-items-center rounded-2xl bg-primary text-primary-content">
          <AppIcon name="sparkle" :size="22" />
        </span>
        <span class="flex flex-col leading-none">
          <span class="text-lg font-extrabold tracking-tight">{{ appConfig.name }}</span>
          <span class="hidden text-[11px] font-medium text-base-content/60 sm:block">
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
          class="rounded-xl px-3 py-2 text-sm font-semibold text-base-content/70 transition hover:bg-base-200 hover:text-base-content"
          active-class="bg-base-200 text-base-content"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <NetworkBadge class="hidden sm:inline-flex" />
        <ThemeToggle />
        <WalletButton />
      </div>
    </div>
  </header>
</template>
