<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { explorerUrl, useWalletStore } from '@/stores/wallet'
import AppIcon from '@/components/AppIcon.vue'
import { type WalletTransaction } from '@/services/walletHistory'

const wallet = useWalletStore()
const recipient = ref('')
const amount = ref('')
const copyMessage = ref('')
const submitted = ref(false)
const qrDialog = ref<HTMLDialogElement | null>(null)
const ready = computed(() => wallet.connected && wallet.isSepolia && !wallet.connecting && !wallet.sending)
const dateTime = (value: number | null) => value === null ? '—' : new Intl.DateTimeFormat('hr-HR', { dateStyle: 'short', timeStyle: 'short' }).format(value)
const statusLabels = { pending: 'Čeka potvrdu', confirmed: 'Potvrđeno', failed: 'Neuspjelo' }

watch(() => wallet.address, () => {
  qrDialog.value?.close()
  recipient.value = ''
  amount.value = ''
  copyMessage.value = ''
  submitted.value = false
})

function isOutgoing(tx: WalletTransaction) {
  return tx.from.toLowerCase() === wallet.address?.toLowerCase()
}

function counterparty(tx: WalletTransaction) {
  return isOutgoing(tx) ? tx.to : tx.from
}

function direction(tx: WalletTransaction) {
  if (tx.from.toLowerCase() === tx.to?.toLowerCase()) return 'Vlastiti račun'
  return isOutgoing(tx) ? 'Odlazno' : 'Ulazno'
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(wallet.address ?? '')
    copyMessage.value = 'Adresa je kopirana.'
  } catch {
    copyMessage.value = 'Kopiranje nije uspjelo. Označi i kopiraj adresu ručno.'
  }
}

async function submit() {
  submitted.value = false
  if (await wallet.send(recipient.value, amount.value)) {
    amount.value = ''
    submitted.value = true
  }
}
</script>

<template>
  <div class="page-shell">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-primary">Moj wallet</p>
        <h1 class="mt-1 text-xl font-semibold">Sepolia ETH na jednom mjestu</h1>
        <p class="mt-2 text-sm text-base-content/70">Pregled salda, slanje i primanje na Ethereum testnoj mreži.</p>
      </div>
      <span class="badge badge-outline gap-2 font-mono text-[11px]">
        <span class="size-2 rounded-full" :class="wallet.isSepolia ? 'bg-success' : 'bg-warning'"></span>
        {{ wallet.connected ? (wallet.isSepolia ? 'Sepolia' : 'Druga mreža') : 'Sepolia · nije spojeno' }}
      </span>
    </div>
    <div v-if="wallet.error || wallet.refreshError" role="alert" class="alert alert-error mt-6 text-sm">{{ wallet.error || wallet.refreshError }}</div>
    <div v-if="wallet.connected && !wallet.isSepolia" class="alert alert-warning mt-4 flex flex-wrap justify-between text-sm">
      <span>Odaberi Sepoliju za prikaz salda i slanje testnog ETH-a.</span>
      <button type="button" class="btn btn-sm" :disabled="wallet.connecting || wallet.sending" @click="wallet.switchNetwork()">Prebaci na Sepoliju</button>
    </div>

    <div class="mt-4 grid items-start gap-4 lg:grid-cols-2">
      <section class="app-panel">
        <div class="panel-heading">
          <h2 class="flex items-center gap-2 font-semibold"><AppIcon name="wallet" :size="18" /> Trenutni saldo</h2>
          <button v-if="wallet.connected" type="button" class="btn btn-ghost btn-sm" :disabled="wallet.refreshing || wallet.sending" @click="wallet.refresh()">
            {{ wallet.refreshing ? 'Osvježavam…' : 'Osvježi' }}
          </button>
        </div>
        <div class="panel-body">
          <template v-if="wallet.connected">
            <div class="rounded-md border border-base-300 bg-base-200/60 px-4 py-3">
              <p class="break-all font-mono text-xl font-semibold tabular-nums sm:text-2xl">{{ wallet.balance }}</p>
              <p class="mt-1 text-xs font-semibold text-primary">Sepolia ETH</p>
              <p class="mt-2 text-xs text-base-content/70">{{ wallet.updatedAt ? `Osvježeno ${dateTime(wallet.updatedAt)}` : 'Saldo trenutačno nije dostupan.' }}</p>
            </div>
            <div class="mt-4">
              <h3 class="text-sm font-bold">Primi Sepolia ETH</h3>
              <p class="mt-1 text-sm text-base-content/70">Podijeli ovu adresu s pošiljateljem i odaberite mrežu Sepolia.</p>
              <p class="mt-2 select-all break-all rounded-md border border-base-300 bg-base-200/50 p-2.5 font-mono text-xs">{{ wallet.address }}</p>
              <div class="wallet-actions mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                <button type="button" class="btn btn-outline btn-sm gap-2 rounded-md" @click="copyAddress()"><AppIcon name="copy" :size="16" />Kopiraj adresu</button>
                <button type="button" class="btn btn-outline btn-sm gap-2 rounded-md" aria-haspopup="dialog" aria-controls="wallet-address-qr" @click="qrDialog?.showModal()"><AppIcon name="qr-code" :size="16" />Prikaži QR kod</button>
                <a :href="`${explorerUrl}/address/${wallet.address}`" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm gap-2 rounded-md sm:w-auto">Povijest na exploreru <AppIcon name="arrow-up-right" :size="16" /></a>
              </div>
              <p v-if="copyMessage" role="status" class="mt-2 text-xs">{{ copyMessage }}</p>
            </div>
            <button type="button" class="btn btn-ghost btn-sm mt-3 gap-2" :disabled="wallet.sending || wallet.connecting" @click="wallet.disconnect()"><AppIcon name="sign-out" :size="16" />Odspoji wallet</button>
          </template>
          <div v-else class="rounded-md border border-dashed border-base-300 bg-base-200/40 p-4 text-center">
            <p class="font-semibold">Poveži svoj Ethereum wallet</p>
            <p class="mt-2 text-sm text-base-content/70">Koristi MetaMask ili kompatibilan wallet. Povezivanje i svako slanje potvrđuješ u walletu.</p>
            <button type="button" class="btn btn-primary btn-sm mt-4 rounded-md" :disabled="wallet.connecting" @click="wallet.connect()">
              <span v-if="wallet.connecting" class="loading loading-spinner loading-xs"></span>
              {{ wallet.connecting ? 'Spajam…' : 'Poveži wallet' }}
            </button>
          </div>
        </div>
      </section>

      <section class="app-panel">
        <div class="panel-heading">
          <h2 class="flex items-center gap-2 font-semibold"><AppIcon name="arrow-up-right" :size="18" /> Pošalji Sepolia ETH</h2>
        </div>
        <div class="panel-body">
          <p class="mt-2 text-sm text-base-content/70">Unesi primatelja i iznos. Wallet će prikazati mrežnu naknadu prije potvrde.</p>
          <form class="mt-4 space-y-3" @submit.prevent="submit()">
            <div>
              <label for="recipient" class="field-label">Adresa primatelja</label>
              <input id="recipient" v-model="recipient" type="text" autocomplete="off" spellcheck="false" placeholder="0x…" class="input input-sm w-full rounded-md font-mono" :disabled="!ready" required />
            </div>
            <div>
              <label for="amount" class="field-label">Iznos u Sepolia ETH</label>
              <input id="amount" v-model="amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0.01" class="input input-sm w-full rounded-md" :disabled="!ready" required aria-describedby="amount-hint" />
              <p id="amount-hint" class="mt-2 text-xs text-base-content/70">Koristi decimalnu točku. Ostavi dio salda za mrežnu naknadu.</p>
            </div>
            <button type="submit" class="btn btn-primary btn-sm w-full rounded-md" :disabled="!ready || !recipient.trim() || !amount.trim()">
              <span v-if="wallet.sending" class="loading loading-spinner loading-xs"></span>
              {{ wallet.sending ? 'Potvrdi slanje u walletu…' : 'Nastavi u walletu' }}
            </button>
            <p v-if="!wallet.connected" class="text-center text-xs text-base-content/70">Za slanje prvo poveži wallet.</p>
            <p v-if="submitted" role="status" class="text-sm text-success">Transakcija je poslana. Status potvrde prati u pregledu ispod.</p>
          </form>
        </div>
      </section>
    </div>

    <section class="app-panel mt-4" :aria-busy="wallet.historyLoading">
      <div class="panel-heading">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <h2>Povijest transakcija</h2>
          <span class="badge badge-ghost badge-sm font-mono">{{ wallet.activity.length }} {{ wallet.hasMoreHistory ? 'učitano' : 'zapisa' }}</span>
        </div>
        <button type="button" class="btn btn-ghost btn-sm w-full sm:w-auto" :disabled="!wallet.connected || !wallet.isSepolia || wallet.historyLoading" @click="wallet.loadHistory()">
          <span v-if="wallet.historyLoading" class="loading loading-spinner loading-xs"></span>
          {{ wallet.historyLoading ? 'Učitavam…' : 'Osvježi povijest' }}
        </button>
      </div>
      <div class="border-b border-base-300 px-4 py-3 text-xs text-base-content/70">
        <p>Ulazne i izlazne Sepolia transakcije te interni ETH prijenosi preko ugovora. Najnoviji zapisi su prvi; stariji su dostupni ispod popisa.</p>
        <p class="mt-1">Izvor: <a href="https://eth-sepolia.blockscout.com" target="_blank" rel="noopener noreferrer" class="link">Blockscout</a><span v-if="wallet.historyUpdatedAt"> · Osvježeno {{ dateTime(wallet.historyUpdatedAt) }}</span> · Novi zapisi mogu se pojaviti s odmakom.</p>
      </div>
      <div v-if="wallet.historyError" role="alert" class="m-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
        {{ wallet.historyError }}
        <a v-if="wallet.address" :href="`${explorerUrl}/address/${wallet.address}`" target="_blank" rel="noopener noreferrer" class="link ml-1">Otvori Etherscan</a>
      </div>
      <div v-if="wallet.historyLoading && !wallet.activity.length" role="status" class="flex items-center gap-2 px-4 py-6 text-sm text-base-content/70">
        <span class="loading loading-spinner loading-sm"></span>Učitavam povijest walleta…
      </div>
      <div v-else-if="!wallet.activity.length" class="flex items-center gap-3 px-4 py-6">
        <span class="grid size-10 shrink-0 place-items-center rounded-md border border-base-300 bg-base-200 text-base-content/60"><AppIcon name="hand-coins" :size="22" /></span>
        <div>
          <p class="text-sm font-semibold">{{ !wallet.connected ? 'Poveži wallet za prikaz povijesti' : !wallet.isSepolia ? 'Odaberi mrežu Sepolia' : wallet.historyError ? 'Povijest nije dostupna' : wallet.historyLoaded ? 'Nema transakcija za ovu adresu' : 'Povijest još nije učitana' }}</p>
          <p class="mt-1 text-xs text-base-content/70">Prikazuju se zapisi za povezanu adresu, uključujući transakcije izvan ove aplikacije.</p>
        </div>
      </div>
      <template v-else>
        <div class="hidden border-b border-base-300 bg-base-200/50 lg:grid lg:grid-cols-[.8fr_1.1fr_1.25fr_1fr_1fr_1fr_1.2fr] lg:items-center lg:gap-3.5 lg:px-4 lg:py-3.5" aria-hidden="true">
          <span class="data-label">Smjer / vrsta</span>
          <span class="data-label">Iznos</span>
          <span class="data-label">Druga adresa</span>
          <span class="data-label">Status</span>
          <span class="data-label">Naknada</span>
          <span class="data-label">Poslano</span>
          <span class="data-label">Transakcija</span>
        </div>
        <ul class="divide-y divide-base-300">
          <li v-for="tx in wallet.activity" :key="tx.id" class="transaction-row even:bg-base-200/30">
            <div class="tx-direction">
              <p class="data-label sr-only">Smjer / vrsta</p>
              <p class="text-xs font-semibold" :class="!isOutgoing(tx) && tx.status === 'confirmed' ? 'text-success' : ''">{{ direction(tx) }}</p>
              <p v-if="tx.kind === 'internal'" class="mt-0.5 text-[11px] text-base-content/70">Interni ETH</p>
            </div>
            <div class="tx-amount min-w-0">
              <p class="data-label sr-only">Iznos</p>
              <p class="break-all font-mono text-lg font-semibold tabular-nums lg:text-xs">{{ tx.amount }} ETH</p>
            </div>
            <div class="tx-address min-w-0">
              <p class="data-label mb-1 lg:sr-only">{{ isOutgoing(tx) ? 'Primatelj' : 'Pošiljatelj' }}</p>
              <a v-if="counterparty(tx)" :href="`${explorerUrl}/address/${counterparty(tx)}`" :title="counterparty(tx) ?? undefined" target="_blank" rel="noopener noreferrer" class="transaction-link link link-hover block break-all font-mono text-xs text-primary lg:truncate">{{ counterparty(tx) }}</a>
              <span v-else class="text-xs text-base-content/70">Kreiranje ugovora</span>
            </div>
            <div class="tx-status">
              <p class="data-label sr-only">Status</p>
              <span class="badge badge-sm gap-1 whitespace-nowrap" :class="tx.status === 'confirmed' ? 'badge-success badge-soft' : tx.status === 'failed' ? 'badge-error badge-soft' : 'badge-warning badge-soft'">
                <span v-if="tx.status === 'pending'" class="loading loading-spinner loading-xs"></span>
                {{ statusLabels[tx.status] }}
              </span>
            </div>
            <div class="tx-fee min-w-0">
              <p class="data-label mb-1 lg:sr-only">Mrežna naknada</p>
              <p class="break-all font-mono text-xs tabular-nums">{{ tx.fee ? `${tx.fee} ETH` : '—' }}</p>
            </div>
            <div class="tx-date min-w-0">
              <p class="data-label mb-1 lg:sr-only">Poslano</p>
              <p class="text-xs tabular-nums">{{ dateTime(tx.createdAt) }}</p>
            </div>
            <div class="tx-reference min-w-0">
              <p class="data-label mb-1 lg:sr-only">Transakcija</p>
              <a :href="`${explorerUrl}/tx/${tx.hash}`" :title="tx.hash" target="_blank" rel="noopener noreferrer" class="transaction-link inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary hover:underline">
                <span class="truncate">{{ tx.hash.slice(0, 8) }}…{{ tx.hash.slice(-6) }}</span><AppIcon name="arrow-up-right" :size="14" class="shrink-0" />
                <span class="sr-only">Detalji transakcije na Etherscanu</span>
              </a>
            </div>
          </li>
        </ul>
      </template>
      <div v-if="wallet.hasMoreHistory" class="border-t border-base-300 px-4 py-3 text-center">
        <button type="button" class="btn btn-outline btn-sm w-full sm:w-auto" :disabled="wallet.historyLoading" @click="wallet.loadHistory(true)">
          <span v-if="wallet.historyLoading" class="loading loading-spinner loading-xs"></span>
          Učitaj starije
        </button>
      </div>
    </section>
    <p class="mt-4 flex items-start gap-2 text-xs text-base-content/70"><AppIcon name="info" :size="18" class="shrink-0" />Sepolia je testna mreža. Koristi samo testni ETH. Naknadu transakcije plaća pošiljatelj; iznos neuspjele transakcije nije prenesen. ERC-20 prijenosi dostupni su na exploreru.</p>

    <dialog id="wallet-address-qr" ref="qrDialog" class="modal" aria-labelledby="wallet-qr-title" aria-describedby="wallet-qr-description">
      <div class="wallet-qr-box modal-box max-w-sm rounded-lg border border-base-300 p-5 text-center">
        <h2 id="wallet-qr-title" class="text-lg font-semibold">Primi Sepolia ETH</h2>
        <span class="badge badge-outline mt-3">Sepolia · testna mreža</span>
        <p id="wallet-qr-description" class="mt-4 text-sm text-base-content/70">Skeniraj adresu walletom pošiljatelja i odaberi mrežu Sepolia.</p>
        <div v-if="wallet.address" class="mx-auto mt-5 w-fit max-w-full rounded-md bg-white p-3">
          <QrcodeVue :value="wallet.address" :size="224" :margin="4" level="M" render-as="svg" background="#ffffff" foreground="#000000" class="h-auto max-w-full" role="img" aria-label="QR kod adrese za primanje Sepolia ETH-a" />
        </div>
        <p class="mt-4 select-all break-all rounded-md bg-base-200 p-3 font-mono text-xs">{{ wallet.address }}</p>
        <button type="button" class="btn btn-outline btn-sm mt-4 gap-2 rounded-md" @click="copyAddress()"><AppIcon name="copy" :size="16" />Kopiraj adresu</button>
        <p v-if="copyMessage" role="status" class="mt-2 text-xs">{{ copyMessage }}</p>
        <form method="dialog" class="modal-action mt-4">
          <button class="btn w-full rounded-md">Zatvori</button>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Zatvori QR kod">Zatvori</button>
      </form>
    </dialog>
  </div>
</template>
