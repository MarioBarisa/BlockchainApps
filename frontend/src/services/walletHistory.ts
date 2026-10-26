import { formatEther, getAddress, isHexString } from 'ethers'

export interface WalletTransaction {
  id: string
  hash: string
  from: string
  to: string | null
  amount: string
  createdAt: number | null
  status: 'pending' | 'confirmed' | 'failed'
  kind: 'transaction' | 'internal'
  fee?: string
}

export type HistoryCursor = Record<string, string | number | boolean>
export type HistoryEndpoint = 'transactions' | 'internal-transactions'

interface ExplorerTransaction {
  hash?: string
  transaction_hash?: string
  from: { hash: string }
  to: { hash: string } | null
  created_contract?: { hash: string } | null
  value: string
  timestamp: string | null
  block_number: number | null
  status?: string | null
  success?: boolean
  index?: number
  fee?: { type: string; value: string | null }
}

export const historyExplorerUrl = 'https://eth-sepolia.blockscout.com'

function parseTransaction(item: ExplorerTransaction, internal: boolean): WalletTransaction {
  const hash = internal ? item.transaction_hash : item.hash
  if (!hash || !isHexString(hash, 32)) throw new Error('Neispravan hash transakcije')
  if (typeof item.value !== 'string' || !/^\d+$/.test(item.value)) throw new Error('Neispravan iznos')
  const createdAt = item.timestamp ? Date.parse(item.timestamp) : null
  if (createdAt !== null && !Number.isFinite(createdAt)) throw new Error('Neispravno vrijeme')
  let status: WalletTransaction['status']
  if (internal) {
    if (!Number.isInteger(item.index) || typeof item.success !== 'boolean') throw new Error('Neispravan interni prijenos')
    status = item.success ? 'confirmed' : 'failed'
  } else if (item.block_number === null) {
    status = 'pending'
  } else if (item.status === 'ok' || item.status === 'error') {
    status = item.status === 'ok' ? 'confirmed' : 'failed'
  } else {
    throw new Error('Nepoznat status transakcije')
  }
  const to = item.to?.hash ?? item.created_contract?.hash
  return {
    id: internal ? `${hash}:${item.index}` : hash,
    hash,
    from: getAddress(item.from.hash),
    to: to ? getAddress(to) : null,
    amount: formatEther(item.value),
    createdAt,
    status,
    kind: internal ? 'internal' : 'transaction',
    fee: !internal && item.fee?.type === 'actual' && item.fee.value !== null ? formatEther(item.fee.value) : undefined,
  }
}

export async function getWalletHistory(
  address: string,
  endpoint: HistoryEndpoint,
  cursor: HistoryCursor | null,
  signal: AbortSignal,
) {
  const url = new URL(`${historyExplorerUrl}/api/v2/addresses/${getAddress(address)}/${endpoint}`)
  if (endpoint === 'internal-transactions') url.searchParams.set('include_zero_value', 'false')
  for (const [key, value] of Object.entries(cursor ?? {})) url.searchParams.set(key, String(value))
  const response = await fetch(url, { signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]) })
  if (!response.ok) throw new Error(`Explorer HTTP ${response.status}`)
  const data = await response.json() as { items?: ExplorerTransaction[]; next_page_params?: HistoryCursor | null }
  if (!Array.isArray(data.items) || !('next_page_params' in data)) throw new Error('Neispravan odgovor explorera')
  const nextPage = data.next_page_params ?? null
  if (nextPage && (typeof nextPage !== 'object' || Array.isArray(nextPage) ||
    Object.values(nextPage).some((value) => !['string', 'number', 'boolean'].includes(typeof value)))) {
    throw new Error('Neispravna paginacija')
  }
  const items = data.items.map((item) => parseTransaction(item, endpoint === 'internal-transactions'))
    .filter((item) => item.kind !== 'internal' || item.amount !== '0.0')
  return { items, nextPage }
}
