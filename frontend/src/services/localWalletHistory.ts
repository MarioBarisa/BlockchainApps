import { formatEther, getAddress, isHexString, toQuantity, type Eip1193Provider } from 'ethers'
import type { WalletTransaction } from '@/services/walletHistory'

interface LocalTransaction {
  hash: string
  from: string
  to: string | null
  value: string
}

interface LocalBlock {
  number: string
  hash: string
  timestamp: string
  transactions: LocalTransaction[]
}

interface LocalReceipt {
  status: string
  blockHash: string
  gasUsed: string
  effectiveGasPrice: string
  contractAddress: string | null
}

export interface LocalHistorySnapshot {
  account: string
  block: { number: number; hash: string }
  items: WalletTransaction[]
  reset: boolean
}

export async function getLocalWalletHistory(
  provider: Eip1193Provider,
  address: string,
  signal: AbortSignal,
  previous: LocalHistorySnapshot | null = null,
): Promise<LocalHistorySnapshot> {
  async function request<T>(method: string, params: unknown[] = []): Promise<T> {
    signal.throwIfAborted()
    const result = await provider.request({ method, params })
    signal.throwIfAborted()
    return result as T
  }

  const account = getAddress(address).toLowerCase()
  if (BigInt(await request<string>('eth_chainId')) !== 31337n) throw new Error('Pogresna lokalna mreza')
  const latest = await request<LocalBlock | null>('eth_getBlockByNumber', ['latest', true])
  if (!latest || !isHexString(latest.hash, 32)) throw new Error('Lokalni blok nije dostupan')
  const number = Number(BigInt(latest.number))
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Neispravan broj bloka')

  // Ponovno koristimo starije zapise samo ako pripadaju istom lancu i racunu.
  let reset = false
  if (previous) {
    const anchor = previous.block.number > number ? null
      : await request<LocalBlock | null>('eth_getBlockByNumber', [toQuantity(previous.block.number), false])
    reset = anchor?.hash !== previous.block.hash
  }
  const reuse = previous !== null && !reset && previous.account === account
  const firstBlock = reuse ? previous.block.number + 1 : 0
  const items: WalletTransaction[] = []

  for (let blockNumber = number; blockNumber >= firstBlock; blockNumber--) {
    const block = blockNumber === number ? latest
      : await request<LocalBlock | null>('eth_getBlockByNumber', [toQuantity(blockNumber), true])
    if (!block || Number(BigInt(block.number)) !== blockNumber || !Array.isArray(block.transactions)) {
      throw new Error('Povijest lokalnog lanca se promijenila')
    }
    const timestamp = Number(BigInt(block.timestamp)) * 1000
    if (!Number.isSafeInteger(timestamp)) throw new Error('Neispravno vrijeme bloka')
    for (const tx of [...block.transactions].reverse()) {
      const matches = tx.from.toLowerCase() === account || tx.to?.toLowerCase() === account
      if (!matches && tx.to !== null) continue
      const receipt = await request<LocalReceipt | null>('eth_getTransactionReceipt', [tx.hash])
      if (!receipt || receipt.blockHash !== block.hash || !isHexString(tx.hash, 32)) {
        throw new Error('Potvrda lokalne transakcije nije dostupna')
      }
      const to = tx.to ?? receipt.contractAddress
      if (!matches && to?.toLowerCase() !== account) continue
      const status = BigInt(receipt.status)
      if (status !== 0n && status !== 1n) throw new Error('Nepoznat status transakcije')
      items.push({
        id: tx.hash, hash: tx.hash, from: getAddress(tx.from), to: to ? getAddress(to) : null,
        amount: formatEther(BigInt(tx.value)), createdAt: timestamp,
        status: status === 1n ? 'confirmed' : 'failed', kind: 'transaction',
        fee: formatEther(BigInt(receipt.gasUsed) * BigInt(receipt.effectiveGasPrice)),
      })
    }
  }

  const anchor = await request<LocalBlock | null>('eth_getBlockByNumber', [toQuantity(number), false])
  if (anchor?.hash !== latest.hash || BigInt(await request<string>('eth_chainId')) !== 31337n) {
    throw new Error('Lokalni lanac se promijenio tijekom dohvata')
  }
  return { account, block: { number, hash: latest.hash }, items: [...items, ...(reuse ? previous.items : [])], reset }
}
