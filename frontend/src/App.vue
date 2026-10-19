<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppDock from '@/components/AppDock.vue'
</script>

<template>
  <!-- Na mobitelu cijela stranica ima odmak za fiksni dock -->
  <div class="flex min-h-dvh flex-col bg-base-200/40 pb-20 md:pb-0">
    <AppNavbar />

    <main class="flex-1">
      <RouterView />
    </main>

    <AppFooter />
    <AppDock />
  </div>
</template>
