import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { transpileModule, ScriptTarget, ModuleKind } from 'typescript'
import { createPinia, setActivePinia } from 'pinia'

// Izvorni TypeScript ucitavamo bez dodatnog testnog frameworka.
function moduleUrl(file, aliases = {}) {
  let source = readFileSync(new URL(file, import.meta.url), 'utf8')
  source = source.replace(/from '([^']+)'/g, (_, name) => `from '${aliases[name] ?? import.meta.resolve(name)}'`)
  const js = transpileModule(source, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.ESNext } }).outputText
  return `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`
}

const historyUrl = moduleUrl('../src/services/walletHistory.ts')
const configUrl = moduleUrl('../src/config/app.ts')
const { getWalletHistory } = await import(historyUrl)
const { useWalletStore } = await import(moduleUrl('../src/stores/wallet.ts', {
  '@/config/app': configUrl,
  '@/services/walletHistory': historyUrl,
}))
const account = '0x1111111111111111111111111111111111111111'
const other = '0x2222222222222222222222222222222222222222'
const hash = (digit) => `0x${digit.repeat(64)}`
const page = (items = [], next = null) => ({ items, next_page_params: next })
const response = (data) => new Response(JSON.stringify(data))
const flush = () => new Promise((resolve) => setImmediate(resolve))
const originalFetch = globalThis.fetch
const originalWindow = globalThis.window
let wallet
let accounts
let network
let listeners
let fetchHandler
let receipt
let sendCount

function transaction(digit, from = account, to = other, timestamp = '2026-10-26T09:00:00Z') {
  return {
    hash: hash(digit), from: { hash: from }, to: to ? { hash: to } : null,
    value: '1000000000000000', timestamp, block_number: 123, status: 'ok',
    fee: { type: 'actual', value: '21000000000000' },
  }
}

function internal(digit, index = 1) {
  return {
    ...transaction(digit, other, account), hash: undefined,
    transaction_hash: hash(digit), index, success: true,
  }
}

beforeEach(() => {
  accounts = [account]
  network = '0xaa36a7'
  listeners = new Map()
  receipt = null
  sendCount = 0
  fetchHandler = async () => response(page())
  globalThis.fetch = (...args) => fetchHandler(...args)
  globalThis.window = { ethereum: {
    on: (event, listener) => listeners.set(event, listener),
    removeListener: (event) => listeners.delete(event),
    async request({ method, params }) {
      if (method === 'eth_accounts' || method === 'eth_requestAccounts') return accounts
      if (method === 'eth_chainId') return network
      if (method === 'eth_getBalance') return '0xde0b6b3a7640000'
      if (method === 'eth_getTransactionReceipt') return receipt
      if (method === 'eth_estimateGas') return '0x5208'
      if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return '0x3b9aca00'
      if (method === 'eth_blockNumber') return '0x10'
      if (method === 'eth_getBlockByNumber') return {
        hash: hash('a'), parentHash: hash('b'), number: '0x10', timestamp: '0x1234', nonce: '0x0000000000000000',
        difficulty: '0x0', gasLimit: '0x1c9c380', gasUsed: '0x5208', miner: account,
        extraData: '0x', transactions: [], baseFeePerGas: '0x3b9aca00',
      }
      if (method === 'eth_sendTransaction') {
        sendCount++
        assert.equal(params[0].chainId, '0xaa36a7')
        return hash('f')
      }
      if (method === 'eth_getTransactionByHash') return {
        hash: hash('f'), from: account, to: other, nonce: '0x0', gas: '0x5208', gasPrice: '0x3b9aca00',
        value: '0x38d7ea4c68000', input: '0x', chainId: network, type: '0x0', v: '0x1b',
        r: hash('1'), s: hash('2'), blockHash: null, blockNumber: null, transactionIndex: null,
      }
      throw new Error(`Unexpected RPC: ${method}`)
    },
  } }
  setActivePinia(createPinia())
  wallet = useWalletStore()
})

afterEach(() => {
  wallet.disconnect()
  globalThis.fetch = originalFetch
  if (originalWindow === undefined) delete globalThis.window
  else globalThis.window = originalWindow
})

test('normalizira iznose, stvarnu naknadu, statuse i kreiranje ugovora', async () => {
  fetchHandler = async () => response(page([
    transaction('1'),
    { ...transaction('2'), status: 'error' },
    { ...transaction('3', account, null), block_number: null, timestamp: null, fee: { type: 'maximum', value: '5' } },
  ]))
  const result = await getWalletHistory(account, 'transactions', null, new AbortController().signal)
  assert.equal(result.items[0].amount, '0.001')
  assert.equal(result.items[0].fee, '0.000021')
  assert.equal(result.items[1].status, 'failed')
  assert.equal(result.items[2].status, 'pending')
  assert.equal(result.items[2].to, null)
  assert.equal(result.items[2].createdAt, null)
  assert.equal(result.items[2].fee, undefined)
})

test('razlikuje interne prijenose istog hasha i preskace nulte iznose', async () => {
  fetchHandler = async (url) => {
    assert.equal(url.searchParams.get('include_zero_value'), 'false')
    return response(page([internal('1', 1), internal('1', 2), { ...internal('1', 3), value: '0' }]))
  }
  const result = await getWalletHistory(account, 'internal-transactions', null, new AbortController().signal)
  assert.equal(result.items.length, 2)
  assert.notEqual(result.items[0].id, result.items[1].id)
  assert.equal(result.items[0].fee, undefined)
})

test('odbija HTTP gresku i nepoznat status umjesto prikaza lazne potvrde', async () => {
  fetchHandler = async () => new Response('', { status: 429 })
  await assert.rejects(getWalletHistory(account, 'transactions', null, new AbortController().signal), /429/)
  fetchHandler = async () => response(page([{ ...transaction('1'), status: 'unknown' }]))
  await assert.rejects(getWalletHistory(account, 'transactions', null, new AbortController().signal), /status/)
})

test('automatski ucitava oba smjera, sortira i spaja stranice bez duplikata', async () => {
  let calls = 0
  fetchHandler = async (url) => {
    calls++
    if (url.pathname.endsWith('internal-transactions')) return response(page([internal('3')]))
    if (url.searchParams.has('block_number')) return response(page([transaction('2', other, account), transaction('4', account, other, '2025-01-01T00:00:00Z')]))
    return response(page([transaction('1'), transaction('2', other, account)], { block_number: 123, index: 5 }))
  }
  await wallet.connect()
  await flush()
  assert.equal(wallet.activity.length, 3)
  assert.equal(wallet.hasMoreHistory, true)
  await wallet.loadHistory(true)
  assert.equal(wallet.activity.length, 4)
  assert.equal(wallet.activity.at(-1).hash, hash('4'))
  assert.equal(wallet.hasMoreHistory, false)
  assert.equal(calls, 3)
  await wallet.loadHistory(true)
  assert.equal(calls, 3)
})

test('ponovno spajanje dohvaća raniju povijest bez lokalne sesije', async () => {
  fetchHandler = async (url) => response(page(url.pathname.endsWith('/transactions') ? [transaction('1')] : []))
  await wallet.connect()
  await flush()
  wallet.disconnect()
  setActivePinia(createPinia())
  wallet = useWalletStore()
  await wallet.connect()
  await flush()
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].hash, hash('1'))
})

test('greska novog dohvata zadrzava postojecu povijest i dopusta ponovni pokusaj', async () => {
  fetchHandler = async (url) => response(page(url.pathname.endsWith('/transactions') ? [transaction('1')] : []))
  await wallet.connect()
  await flush()
  fetchHandler = async () => new Response('', { status: 503 })
  await wallet.loadHistory()
  assert.equal(wallet.activity.length, 1)
  assert.ok(wallet.historyError)
  assert.equal(wallet.historyLoading, false)
  fetchHandler = async () => response(page())
  await wallet.loadHistory()
  assert.equal(wallet.activity.length, 0)
  assert.equal(wallet.historyError, '')
})

test('zakasnjeli odgovor prethodnog racuna ne ulazi u povijest novog racuna', async () => {
  const pending = []
  fetchHandler = (url, options) => new Promise((resolve) => pending.push({ resolve, signal: options.signal, url }))
  await wallet.connect()
  assert.equal(pending.length, 2)
  accounts = [other]
  listeners.get('accountsChanged')()
  await flush()
  assert.equal(pending.length, 4)
  assert.equal(pending[0].signal.aborted, true)
  pending[0].resolve(response(page([transaction('1')])))
  pending[1].resolve(response(page()))
  await flush()
  assert.equal(wallet.activity.length, 0)
  assert.equal(wallet.historyLoading, true)
  pending[2].resolve(response(page([transaction('2', other, account)])))
  pending[3].resolve(response(page()))
  await flush()
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].hash, hash('2'))
  assert.equal(wallet.historyLoading, false)
})

test('promjena mreze i odspajanje odmah uklanjaju povijest', async () => {
  fetchHandler = async (url) => response(page(url.pathname.endsWith('/transactions') ? [transaction('1')] : []))
  await wallet.connect()
  await flush()
  network = '0x1'
  listeners.get('chainChanged')()
  assert.equal(wallet.activity.length, 0)
  await flush()
  assert.equal(wallet.historyLoaded, false)
  wallet.disconnect()
  assert.equal(listeners.size, 0)
})

test('novo slanje ostaje vidljivo i potvrda iz explorera ga ne duplicira', async () => {
  await wallet.connect()
  await flush()
  assert.equal(await wallet.send(other, '0.001'), true)
  assert.equal(sendCount, 1)
  assert.equal(wallet.activity[0].status, 'pending')
  fetchHandler = async (url) => response(page(url.pathname.endsWith('/transactions') ? [transaction('f')] : []))
  await wallet.loadHistory()
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].status, 'confirmed')
  receipt = { status: '0x1', gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00' }
  await wallet.refresh()
  await flush()
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].fee, '0.000021')
})
