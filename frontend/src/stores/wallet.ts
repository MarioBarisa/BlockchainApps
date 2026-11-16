import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { BrowserProvider, formatEther, getAddress, isAddress, parseEther, type Eip1193Provider } from 'ethers'
import { networks, type NetworkKey } from '@/config/networks'
import { getLocalToken, type TokenSnapshot } from '@/services/proofNewsToken'
import { getWalletHistory, type HistoryCursor, type WalletTransaction } from '@/services/walletHistory'
import { getLocalWalletHistory, type LocalHistorySnapshot } from '@/services/localWalletHistory'

interface WalletProvider extends Eip1193Provider {
  on?: (event: string, listener: () => void) => void
  removeListener?: (event: string, listener: () => void) => void
}

function errorCode(error: unknown) {
  type RpcError = {
    code?: number | string
    data?: { originalError?: { code?: number | string } }
  }
  const details = error as RpcError & { error?: RpcError; info?: { error?: RpcError } }
  const rpcError = details?.info?.error ?? details?.error ?? details
  return rpcError?.data?.originalError?.code ?? rpcError?.code
}

function errorMessage(error: unknown) {
  const code = errorCode(error)
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Zahtjev je odbijen u walletu. Možeš pokušati ponovno.'
  if (code === 4100) return 'MetaMask nije odobrio pristup računu ili slanju. Klikni Ponovno odobri wallet, potvrdi račun i mrežu pa ponovi slanje.'
  if (code === -32002) return 'Zahtjev već čeka potvrdu. Otvori wallet.'
  if (code === 'INSUFFICIENT_FUNDS') return 'Nema dovoljno ETH-a za iznos i mrežnu naknadu.'
  return 'Zahtjev nije uspio. Provjeri wallet i vezu pa pokušaj ponovno.'
}

export const useWalletStore = defineStore('wallet', () => {
  const networkKey = ref<NetworkKey>('sepolia')
  const network = computed(() => networks[networkKey.value])
  const targetChainId = computed(() => `0x${network.value.chainId.toString(16)}`)
  const address = ref<string | null>(null)
  const chainId = ref<string | null>(null)
  const balanceWei = ref<bigint | null>(null)
  const connecting = ref(false)
  const refreshing = ref(false)
  const sending = ref(false)
  const error = ref('')
  const authorizationRequired = ref(false)
  const refreshError = ref('')
  const updatedAt = ref<number | null>(null)
  const transactions = ref<(WalletTransaction & { chainId: number })[]>([])
  const token = ref<TokenSnapshot | null>(null)
  const tokenError = ref('')
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
  let localSnapshot: LocalHistorySnapshot | null = null

  const connected = computed(() => address.value !== null)
  const isSepolia = computed(() => chainId.value === '0xaa36a7')
  const isCorrectNetwork = computed(() => chainId.value === targetChainId.value)
  const actualNetworkName = computed(() => Object.values(networks).find((item) => `0x${item.chainId.toString(16)}` === chainId.value)?.name ?? 'Druga mreža')
  const shortAddress = computed(() => address.value ? `${address.value.slice(0, 6)}...${address.value.slice(-4)}` : '')
  const balance = computed(() => balanceWei.value === null ? '—' : formatEther(balanceWei.value))
  const activity = computed(() => {
    if (!address.value || !isCorrectNetwork.value) return []
    const account = address.value.toLowerCase()
    const items = new Map<string, WalletTransaction>()
    for (const tx of [...transactions.value.filter((tx) => tx.chainId === network.value.chainId), ...historyTransactions.value]) {
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
    if (!provider || !address.value || !isCorrectNetwork.value || historyLoading.value || (older && !hasMoreHistory.value)) return
    const account = address.value
    const currentRevision = revision
    const requestId = ++historyRequestId
    const controller = new AbortController()
    historyController = controller
    historyLoading.value = true
    historyError.value = ''
    try {
      if (networkKey.value === 'hardhat') {
        const snapshot = await getLocalWalletHistory(provider, account, controller.signal, localSnapshot)
        if (requestId !== historyRequestId || currentRevision !== revision || address.value !== account || !isCorrectNetwork.value) return
        if (snapshot.reset) transactions.value = transactions.value.filter((tx) => tx.chainId !== 31337)
        localSnapshot = snapshot
        historyTransactions.value = snapshot.items
        nextTransactions.value = null
        nextInternal.value = null
        historyLoaded.value = true
        historyUpdatedAt.value = Date.now()
        return
      }
      const empty = { items: [] as WalletTransaction[], nextPage: null }
      const [normal, internal] = await Promise.all([
        older && !nextTransactions.value ? empty : getWalletHistory(account, 'transactions', older ? nextTransactions.value : null, controller.signal),
        older && !nextInternal.value ? empty : getWalletHistory(account, 'internal-transactions', older ? nextInternal.value : null, controller.signal),
      ])
      if (requestId !== historyRequestId || currentRevision !== revision || address.value !== account || !isCorrectNetwork.value || !isSepolia.value) return
      const items = new Map<string, WalletTransaction>()
      for (const tx of [...(older ? historyTransactions.value : []), ...normal.items, ...internal.items]) items.set(tx.id, tx)
      historyTransactions.value = [...items.values()]
      nextTransactions.value = normal.nextPage
      nextInternal.value = internal.nextPage
      historyLoaded.value = true
      historyUpdatedAt.value = Date.now()
    } catch {
      if (requestId === historyRequestId && currentRevision === revision) {
        historyError.value = networkKey.value === 'hardhat'
          ? 'Lokalna povijest trenutačno nije dostupna. Provjeri čvor i osvježi povijest. Već učitani zapisi ostaju prikazani.'
          : 'Povijest trenutačno nije dostupna. Pokušaj ponovno ili otvori Etherscan. Već učitani zapisi ostaju prikazani.'
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
      const [accounts, currentChainId] = await Promise.all([
        currentProvider.request({ method: 'eth_accounts' }) as Promise<string[]>,
        currentProvider.request({ method: 'eth_chainId' }) as Promise<string>,
      ])
      if (currentRevision !== revision || requestId !== refreshId) return
      const nextAddress = accounts[0] ? getAddress(accounts[0]) : null
      if (address.value !== nextAddress || chainId.value !== currentChainId) {
        balanceWei.value = null
        updatedAt.value = null
        resetHistory()
        token.value = null
        tokenError.value = ''
      }
      address.value = nextAddress
      chainId.value = currentChainId
      if (!nextAddress || !isCorrectNetwork.value) return
      if ((!historyLoaded.value || networkKey.value === 'hardhat') && !historyLoading.value && !historyError.value) void loadHistory()
      const [rawBalance, receipts, tokenResult] = await Promise.all([
        currentProvider.request({ method: 'eth_getBalance', params: [nextAddress, 'latest'] }) as Promise<string>,
        Promise.all(transactions.value.filter((tx) => tx.status === 'pending' && tx.chainId === network.value.chainId).map(async (tx) => ({
          tx,
          receipt: await currentProvider.request({ method: 'eth_getTransactionReceipt', params: [tx.hash] }) as
            { status: string; gasUsed: string; effectiveGasPrice: string } | null,
        }))),
        networkKey.value === 'hardhat'
          ? getLocalToken(currentProvider, nextAddress)
            .then((data) => ({ data, error: '' }))
            .catch((cause) => ({ data: null, error: cause instanceof Error && !('code' in cause) ? cause.message : 'Token nije dostupan. Provjeri lokalni cvor i ponovi objavu.' }))
          : null,
      ])
      if (currentRevision !== revision || requestId !== refreshId) return
      token.value = tokenResult?.data ?? null
      tokenError.value = tokenResult?.error ?? ''
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
        token.value = null
        tokenError.value = ''
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
    token.value = null
    tokenError.value = ''
    refreshError.value = ''
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
    token.value = null
    tokenError.value = ''
    updatedAt.value = null
    refreshing.value = false
    error.value = ''
    authorizationRequired.value = false
    refreshError.value = ''
  }

  async function reauthorize() {
    if (!provider || connecting.value || sending.value) return false
    const currentProvider = provider
    connecting.value = true
    try {
      try {
        await currentProvider.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] })
      } catch (cause) {
        if (![4200, -32601].includes(Number(errorCode(cause)))) throw cause
      }
      await currentProvider.request({ method: 'eth_requestAccounts' })
      if (provider !== currentProvider) return false
      await requestNetworkChange(currentProvider)
      await refresh()
      if (provider !== currentProvider || !address.value || !isCorrectNetwork.value) return false
      authorizationRequired.value = false
      error.value = ''
      return true
    } catch (cause) {
      if (provider === currentProvider) error.value = errorMessage(cause)
      return false
    } finally {
      connecting.value = false
    }
  }

  async function hasCurrentWallet(currentProvider: WalletProvider, from: string, selectedChainId: number) {
    const [accounts, currentChain] = await Promise.all([
      currentProvider.request({ method: 'eth_accounts' }) as Promise<string[]>,
      currentProvider.request({ method: 'eth_chainId' }) as Promise<string>,
    ])
    if (!accounts.length) throw { code: 4100 }
    return accounts[0]?.toLowerCase() === from.toLowerCase() && BigInt(currentChain) === BigInt(selectedChainId)
  }

  async function requestNetworkChange(currentProvider: WalletProvider) {
    const params = [{ chainId: targetChainId.value }]
    try {
      await currentProvider.request({ method: 'wallet_switchEthereumChain', params })
    } catch (cause) {
      if ((cause as { code?: number })?.code !== 4902 || networkKey.value !== 'hardhat') throw cause
      await currentProvider.request({ method: 'wallet_addEthereumChain', params: [{
        chainId: targetChainId.value, chainName: network.value.name,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: [network.value.rpcUrl],
      }] })
      await currentProvider.request({ method: 'wallet_switchEthereumChain', params })
    }
  }

  async function switchNetwork() {
    if (!provider || connecting.value || sending.value) return
    connecting.value = true
    error.value = ''
    try {
      await requestNetworkChange(provider)
      await refresh()
    } catch (cause) {
      error.value = errorMessage(cause)
    } finally {
      connecting.value = false
    }
  }

  async function selectNetwork(key: NetworkKey) {
    if (!Object.hasOwn(networks, key) || connecting.value || sending.value) return
    if (key !== networkKey.value) {
      revision++
      refreshId++
      networkKey.value = key
      resetHistory()
      balanceWei.value = null
      token.value = null
      tokenError.value = ''
      updatedAt.value = null
      refreshError.value = ''
      refreshing.value = false
    }
    if (provider) await switchNetwork()
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
      if (!isCorrectNetwork.value) {
        await requestNetworkChange(injected)
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
    if (authorizationRequired.value) {
      error.value = errorMessage({ code: 4100 })
      return false
    }
    if (!provider || !address.value || !isCorrectNetwork.value) {
      error.value = `Spoji wallet i odaberi mrežu ${network.value.name}.`
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
    const selectedChainId = network.value.chainId
    const from = address.value
    const currentProvider = provider
    const browserProvider = new BrowserProvider(currentProvider)
    try {
      if (!await hasCurrentWallet(currentProvider, from, selectedChainId)) {
        await refresh()
        error.value = 'Račun ili mreža su promijenjeni. Provjeri podatke i ponovno pokreni slanje.'
        return false
      }
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
        error.value = 'Nema dovoljno ETH-a za iznos i mrežnu naknadu. Smanji iznos.'
        return false
      }
      if (!await hasCurrentWallet(currentProvider, from, selectedChainId) || currentRevision !== revision || !isCorrectNetwork.value) {
        await refresh()
        error.value = 'Račun ili mreža su promijenjeni. Provjeri podatke i pokušaj ponovno.'
        return false
      }
      const tx = await signer.sendTransaction({ to: recipient, value, chainId: selectedChainId, gasLimit: gas })
      transactions.value.unshift({ chainId: selectedChainId, id: tx.hash, hash: tx.hash, from, to: recipient, amount: formatEther(value), createdAt: Date.now(), status: 'pending', kind: 'transaction' })
      await refresh()
      return true
    } catch (cause) {
      if (errorCode(cause) === 4100) authorizationRequired.value = true
      error.value = errorMessage(cause)
      return false
    } finally {
      browserProvider.destroy()
      sending.value = false
    }
  }

  return {
    address, chainId, connecting, connected, shortAddress, balance, isSepolia, refreshing,
    networkKey, network, isCorrectNetwork, actualNetworkName, selectNetwork, token, tokenError,
    sending, error, authorizationRequired, reauthorize, refreshError, updatedAt, activity, connect, disconnect, switchNetwork, refresh, send,
    historyLoading, historyError, historyUpdatedAt, historyLoaded, hasMoreHistory, loadHistory,
  }
})
