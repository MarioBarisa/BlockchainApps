import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { BrowserProvider, formatEther, getAddress, isAddress, parseEther, type Eip1193Provider } from 'ethers'
import { appConfig } from '@/config/app'
import { getWalletHistory, type HistoryCursor, type WalletTransaction } from '@/services/walletHistory'

interface WalletProvider extends Eip1193Provider {
  on?: (event: string, listener: () => void) => void
  removeListener?: (event: string, listener: () => void) => void
}

const sepoliaChainId = `0x${appConfig.network.chainId.toString(16)}`
export const explorerUrl = 'https://sepolia.etherscan.io'

function errorMessage(error: unknown) {
  const details = error as { code?: number | string; info?: { error?: { code?: number } } }
  const code = details?.info?.error?.code ?? details?.code
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Zahtjev je odbijen u walletu. Možeš pokušati ponovno.'
  if (code === -32002) return 'Zahtjev već čeka potvrdu. Otvori wallet.'
  if (code === 'INSUFFICIENT_FUNDS') return 'Nema dovoljno Sepolia ETH-a za iznos i mrežnu naknadu.'
  return 'Zahtjev nije uspio. Provjeri wallet i vezu pa pokušaj ponovno.'
}

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string | null>(null)
  const chainId = ref<string | null>(null)
  const balanceWei = ref<bigint | null>(null)
  const connecting = ref(false)
  const refreshing = ref(false)
  const sending = ref(false)
  const error = ref('')
  const refreshError = ref('')
  const updatedAt = ref<number | null>(null)
  const transactions = ref<WalletTransaction[]>([])
  const historyTransactions = ref<WalletTransaction[]>([])
  const historyLoading = ref(false)
  const historyError = ref('')
  const historyUpdatedAt = ref<number | null>(null)
  const historyLoaded = ref(false)
  const nextTransactions = ref<HistoryCursor | null>(null)
  const nextInternal = ref<HistoryCursor | null>(null)
  const hasMoreHistory = computed(() => nextTransactions.value !== null || nextInternal.value !== null)
  let historyController: AbortController | null = null
  let historyRequestId = 0
  let provider: WalletProvider | null = null
  let timer: ReturnType<typeof setInterval> | undefined
  let revision = 0
  let refreshId = 0

  const connected = computed(() => address.value !== null)
  const isSepolia = computed(() => chainId.value === sepoliaChainId)
  const shortAddress = computed(() => address.value ? `${address.value.slice(0, 6)}...${address.value.slice(-4)}` : '')
  const balance = computed(() => balanceWei.value === null ? '—' : formatEther(balanceWei.value))
  const activity = computed(() => {
    if (!address.value || !isSepolia.value) return []
    const account = address.value.toLowerCase()
    const items = new Map<string, WalletTransaction>()
    for (const tx of [...transactions.value, ...historyTransactions.value]) {
      if (tx.from.toLowerCase() !== account && tx.to?.toLowerCase() !== account) continue
      const known = items.get(tx.id)
      if (known && known.status !== 'pending' && tx.status === 'pending') continue
      items.set(tx.id, tx)
    }
    return [...items.values()].sort((a, b) => (b.createdAt ?? Number.MAX_SAFE_INTEGER) - (a.createdAt ?? Number.MAX_SAFE_INTEGER))
  })

  function resetHistory() {
    historyRequestId++
    historyController?.abort()
    historyController = null
    historyTransactions.value = []
    nextTransactions.value = null
    nextInternal.value = null
    historyLoading.value = false
    historyLoaded.value = false
    historyUpdatedAt.value = null
    historyError.value = ''
  }

  async function loadHistory(older = false) {
    if (!address.value || !isSepolia.value || historyLoading.value || (older && !hasMoreHistory.value)) return
    const account = address.value
    const currentRevision = revision
    const requestId = ++historyRequestId
    const controller = new AbortController()
    historyController = controller
    historyLoading.value = true
    historyError.value = ''
    try {
      const empty = { items: [] as WalletTransaction[], nextPage: null }
      const [normal, internal] = await Promise.all([
        older && !nextTransactions.value ? empty : getWalletHistory(account, 'transactions', older ? nextTransactions.value : null, controller.signal),
        older && !nextInternal.value ? empty : getWalletHistory(account, 'internal-transactions', older ? nextInternal.value : null, controller.signal),
      ])
      if (requestId !== historyRequestId || currentRevision !== revision || address.value !== account || !isSepolia.value) return
      const items = new Map<string, WalletTransaction>()
      for (const tx of [...(older ? historyTransactions.value : []), ...normal.items, ...internal.items]) items.set(tx.id, tx)
      historyTransactions.value = [...items.values()]
      nextTransactions.value = normal.nextPage
      nextInternal.value = internal.nextPage
      historyLoaded.value = true
      historyUpdatedAt.value = Date.now()
    } catch {
      if (requestId === historyRequestId && currentRevision === revision) {
        historyError.value = 'Povijest trenutačno nije dostupna. Pokušaj ponovno ili otvori Etherscan. Već učitani zapisi ostaju prikazani.'
      }
    } finally {
      controller.abort()
      if (requestId === historyRequestId) {
        historyLoading.value = false
        historyController = null
      }
    }
  }

  async function refresh() {
    if (!provider) return
    const currentProvider = provider
    const requestId = ++refreshId
    const currentRevision = revision
    refreshing.value = true
    try {
      const [accounts, network] = await Promise.all([
        currentProvider.request({ method: 'eth_accounts' }) as Promise<string[]>,
        currentProvider.request({ method: 'eth_chainId' }) as Promise<string>,
      ])
      if (currentRevision !== revision || requestId !== refreshId) return
      const nextAddress = accounts[0] ? getAddress(accounts[0]) : null
      if (address.value !== nextAddress || chainId.value !== network) {
        balanceWei.value = null
        updatedAt.value = null
        resetHistory()
      }
      address.value = nextAddress
      chainId.value = network
      if (!nextAddress || network !== sepoliaChainId) return
      if (!historyLoaded.value && !historyLoading.value && !historyError.value) void loadHistory()
      const [rawBalance, receipts] = await Promise.all([
        currentProvider.request({ method: 'eth_getBalance', params: [nextAddress, 'latest'] }) as Promise<string>,
        Promise.all(transactions.value.filter((tx) => tx.status === 'pending').map(async (tx) => ({
          tx,
          receipt: await currentProvider.request({ method: 'eth_getTransactionReceipt', params: [tx.hash] }) as
            { status: string; gasUsed: string; effectiveGasPrice: string } | null,
        }))),
      ])
      if (currentRevision !== revision || requestId !== refreshId) return
      balanceWei.value = BigInt(rawBalance)
      updatedAt.value = Date.now()
      for (const { tx, receipt } of receipts) {
        if (!receipt) continue
        tx.status = BigInt(receipt.status) === 1n ? 'confirmed' : 'failed'
        tx.fee = formatEther(BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice))
      }
      refreshError.value = ''
      if (receipts.some(({ receipt }) => receipt !== null)) void loadHistory()
    } catch (cause) {
      if (currentRevision === revision && requestId === refreshId) {
        balanceWei.value = null
        updatedAt.value = null
        refreshError.value = errorMessage(cause)
      }
    } finally {
      if (requestId === refreshId) refreshing.value = false
    }
  }

  function handleChange() {
    revision++
    resetHistory()
    balanceWei.value = null
    updatedAt.value = null
    chainId.value = null
    address.value = null
    void refresh()
  }

  function disconnect() {
    revision++
    resetHistory()
    refreshId++
    if (timer) clearInterval(timer)
    timer = undefined
    provider?.removeListener?.('accountsChanged', handleChange)
    provider?.removeListener?.('chainChanged', handleChange)
    provider?.removeListener?.('disconnect', disconnect)
    provider = null
    address.value = null
    chainId.value = null
    balanceWei.value = null
    updatedAt.value = null
    refreshing.value = false
    error.value = ''
    refreshError.value = ''
  }

  async function switchNetwork() {
    if (!provider || connecting.value || sending.value) return
    connecting.value = true
    error.value = ''
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: sepoliaChainId }] })
      await refresh()
    } catch (cause) {
      const code = (cause as { code?: number })?.code
      error.value = code === 4902
        ? 'U postavkama walleta uključi testne mreže i dodaj Sepoliju pa pokušaj ponovno.'
        : errorMessage(cause)
    } finally {
      connecting.value = false
    }
  }

  async function connect() {
    if (connecting.value || sending.value) return
    disconnect()
    const injected = (window as Window & { ethereum?: WalletProvider }).ethereum
    if (!injected) {
      error.value = 'Wallet nije pronađen. Instaliraj MetaMask ili otvori aplikaciju u pregledniku svog Ethereum walleta.'
      return
    }
    connecting.value = true
    provider = injected
    provider.on?.('accountsChanged', handleChange)
    provider.on?.('chainChanged', handleChange)
    provider.on?.('disconnect', disconnect)
    try {
      await injected.request({ method: 'eth_requestAccounts' })
      if (provider !== injected) return
      await refresh()
      if (!isSepolia.value) {
        await injected.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: sepoliaChainId }] })
        await refresh()
      }
      if (provider === injected) timer = setInterval(() => { void refresh() }, 12000)
    } catch (cause) {
      if (provider === injected) {
        error.value = (cause as { code?: number })?.code === 4902
          ? 'U walletu uključi testne mreže i odaberi Sepoliju.'
          : errorMessage(cause)
        if (address.value) {
          if (!timer) timer = setInterval(() => { void refresh() }, 12000)
        } else {
          const message = error.value
          disconnect()
          error.value = message
        }
      }
    } finally {
      connecting.value = false
    }
  }

  async function send(to: string, amount: string) {
    if (sending.value) return false
    error.value = ''
    if (!provider || !address.value || !isSepolia.value) {
      error.value = 'Spoji wallet i odaberi mrežu Sepolia.'
      return false
    }
    if (!isAddress(to.trim()) || /^0x0{40}$/i.test(to.trim())) {
      error.value = 'Upiši valjanu Ethereum adresu primatelja (0x…).'
      return false
    }
    let value: bigint
    try {
      if (!/^\d+(\.\d{1,18})?$/.test(amount.trim())) throw new Error()
      value = parseEther(amount.trim())
      if (value <= 0n) throw new Error()
    } catch {
      error.value = 'Upiši iznos veći od nule, s najviše 18 decimala i decimalnom točkom.'
      return false
    }
    sending.value = true
    const currentRevision = revision
    const from = address.value
    const currentProvider = provider
    const browserProvider = new BrowserProvider(currentProvider)
    try {
      const signer = await browserProvider.getSigner(from)
      const recipient = getAddress(to.trim())
      const [gas, fees, available] = await Promise.all([
        signer.estimateGas({ to: recipient, value }),
        browserProvider.getFeeData(),
        browserProvider.getBalance(from),
      ])
      const gasPrice = fees.maxFeePerGas ?? fees.gasPrice
      if (gasPrice === null) throw new Error('Naknada nije dostupna')
      if (value + gas * gasPrice > available) {
        error.value = 'Nema dovoljno Sepolia ETH-a za iznos i mrežnu naknadu. Smanji iznos.'
        return false
      }
      if (currentRevision !== revision || !isSepolia.value) {
        error.value = 'Račun ili mreža su promijenjeni. Provjeri podatke i pokušaj ponovno.'
        return false
      }
      const tx = await signer.sendTransaction({ to: recipient, value, chainId: appConfig.network.chainId, gasLimit: gas })
      transactions.value.unshift({ id: tx.hash, hash: tx.hash, from, to: recipient, amount: formatEther(value), createdAt: Date.now(), status: 'pending', kind: 'transaction' })
      await refresh()
      return true
    } catch (cause) {
      error.value = errorMessage(cause)
      return false
    } finally {
      browserProvider.destroy()
      sending.value = false
    }
  }

  return {
    address, connecting, connected, shortAddress, balance, isSepolia, refreshing,
    sending, error, refreshError, updatedAt, activity, connect, disconnect, switchNetwork, refresh, send,
    historyLoading, historyError, historyUpdatedAt, historyLoaded, hasMoreHistory, loadHistory,
  }
})
