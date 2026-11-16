<script setup lang="ts">
import { onBeforeUnmount, ref, useId } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps<{ address: string; href?: string; label: string }>()
const targetId = useId()
const supportsCommands = 'CommandEvent' in window
const message = ref('')
const copied = ref(false)
let lastMessage = ''
let timer: ReturnType<typeof setTimeout> | undefined
let active = true

async function copy() {
  const address = props.address
  let success = false
  try {
    await navigator.clipboard.writeText(address)
    success = true
  } catch {
    // Poruka objasnjava i rucno kopiranje ako preglednik odbije pristup.
  }
  if (!active || props.address !== address) return
  clearTimeout(timer)
  let text = success ? 'Kopirano' : 'Kopiranje nije uspjelo. Označi i kopiraj adresu ručno.'
  if (text === lastMessage) text += '\u00a0'
  lastMessage = text
  message.value = text
  copied.value = success
  timer = setTimeout(() => { message.value = ''; copied.value = false }, 2500)
}

function handleCommand(event: Event) {
  if ((event as Event & { command: string }).command === '--copy') void copy()
}

onBeforeUnmount(() => {
  active = false
  clearTimeout(timer)
})
</script>

<template>
  <div class="flex min-w-0 items-center gap-1">
    <span :id="targetId" class="min-w-0 flex-1 select-all" @command="handleCommand">
      <a v-if="href" :href="href" :title="address" target="_blank" rel="noopener noreferrer" class="transaction-link link link-hover block break-all font-mono text-xs text-primary lg:truncate">{{ address }}</a>
      <span v-else class="block break-all font-mono text-xs text-base-content/70 lg:truncate" :title="address">{{ address }}</span>
    </span>
    <span class="relative shrink-0">
      <button type="button" class="btn btn-ghost btn-square btn-xs min-h-6 min-w-6" command="--copy" :commandfor="targetId" :aria-label="`Kopiraj adresu ${label}: ${address}`" :title="`Kopiraj adresu ${label}`" @click="!supportsCommands && copy()">
        <AppIcon :name="copied ? 'check-circle' : 'copy'" :size="15" aria-hidden="true" />
      </button>
      <span role="status" class="pointer-events-none absolute bottom-full right-0 z-20 mb-1 w-max max-w-52 rounded border border-base-300 bg-base-100 px-2 py-1 text-xs shadow" :class="message ? 'opacity-100' : 'opacity-0'">{{ message }}</span>
    </span>
  </div>
</template>
