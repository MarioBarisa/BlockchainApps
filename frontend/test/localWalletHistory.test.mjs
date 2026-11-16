import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { moduleUrl } from './moduleUrl.mjs'

const historyUrl = moduleUrl('../src/services/walletHistory.ts')
const { getLocalWalletHistory } = await import(moduleUrl('../src/services/localWalletHistory.ts', {
  '@/services/walletHistory': historyUrl,
}))
const account = '0x1111111111111111111111111111111111111111'
const other = '0x2222222222222222222222222222222222222222'
const third = '0x3333333333333333333333333333333333333333'
const hash = (number, marker = 'a') => `0x${marker}${number.toString(16).padStart(63, '0')}`
let blocks, receipts, calls, chain, changeAnchor

function block(number, transactions = [], marker = 'a') {
  return { number: `0x${number.toString(16)}`, hash: hash(number, marker), timestamp: `0x${(1800000000 + number).toString(16)}`, transactions }
}

function addBlock(transactions, marker = 'a') {
  const next = block(blocks.length, transactions, marker)
  blocks.push(next)
  for (const tx of transactions) receipts.set(tx.hash, {
    status: '0x1', blockHash: next.hash, gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00', contractAddress: null,
  })
}

function transaction(number, from = other, to = account, value = '0x2386f26fc10000') {
  return { hash: hash(number, 'd'), from, to, value }
}

const provider = {
  async request({ method, params }) {
    calls.push({ method, params })
    if (method === 'eth_chainId') return chain
    if (method === 'eth_getBlockByNumber') {
      const result = params[0] === 'latest' ? blocks.at(-1) : blocks[Number(BigInt(params[0]))] ?? null
      return changeAnchor && params[1] === false && result ? { ...result, hash: hash(999) } : result
    }
    if (method === 'eth_getTransactionReceipt') return receipts.get(params[0]) ?? null
    throw new Error(`Nepoznat RPC: ${method}`)
  },
}
const load = (previous = null) => getLocalWalletHistory(provider, account, new AbortController().signal, previous)

beforeEach(() => {
  blocks = [block(0)]
  receipts = new Map()
  calls = []
  chain = '0x7a69'
  changeAnchor = false
})

test('cita cijeli lanac: ulazne, izlazne, vlastite, nulte i neuspjele transakcije te objavu ugovora', async () => {
  addBlock([transaction(1)])
  addBlock([transaction(2, account, other), transaction(3, account, account, '0x0'), transaction(6, other, third)])
  addBlock([transaction(4, account, other, '0x0'), transaction(5, account, null)])
  receipts.get(hash(4, 'd')).status = '0x0'
  receipts.get(hash(5, 'd')).contractAddress = third
  const result = await load()
  assert.deepEqual(result.items.map((tx) => tx.hash), [5, 4, 3, 2, 1].map((number) => hash(number, 'd')))
  assert.equal(result.items[0].to, third)
  assert.equal(result.items[1].status, 'failed')
  assert.equal(result.items[2].amount, '0.0')
  assert.equal(result.items.at(-1).fee, '0.000021')
  assert.equal(result.items.at(-1).createdAt, 1800000001000)
})

test('dohvaca samo nove blokove ako je raniji lanac ostao isti', async () => {
  addBlock([transaction(1)])
  const first = await load()
  addBlock([transaction(2)])
  calls = []
  const second = await load(first)
  assert.equal(second.reset, false)
  assert.deepEqual(second.items.map((tx) => tx.hash), [hash(2, 'd'), hash(1, 'd')])
  assert.equal(calls.some(({ method, params }) => method === 'eth_getBlockByNumber' && params[0] === '0x0' && params[1]), false)
  assert.deepEqual(calls.filter(({ method }) => method === 'eth_getTransactionReceipt').map(({ params }) => params[0]), [hash(2, 'd')])
})

test('promijenjeni blok na istoj visini odbacuje ranije zapise', async () => {
  addBlock([transaction(1)])
  const first = await load()
  blocks = [block(0, [], 'b')]
  receipts.clear()
  addBlock([transaction(2)], 'b')
  const second = await load(first)
  assert.equal(second.reset, true)
  assert.deepEqual(second.items.map((tx) => tx.hash), [hash(2, 'd')])
})

test('snapshot drugog racuna ne prenosi njegove zapise', async () => {
  addBlock([transaction(1)])
  const first = await load()
  const result = await getLocalWalletHistory(provider, third, new AbortController().signal, first)
  assert.equal(result.items.length, 0)
})

test('pogresna mreza i neispravan receipt ne daju laznu potvrdu', async () => {
  chain = '0x1'
  await assert.rejects(load(), /Pogresna lokalna mreza/)
  chain = '0x7a69'
  addBlock([transaction(1)])
  receipts.get(hash(1, 'd')).blockHash = hash(99)
  await assert.rejects(load(), /nije dostupna/)
})

test('promjena lanca tijekom citanja ponistava cijeli rezultat', async () => {
  addBlock([transaction(1)])
  changeAnchor = true
  await assert.rejects(load(), /promijenio tijekom dohvata/)
})

test('nepoznat status receipta odbija se umjesto potvrdenog statusa', async () => {
  addBlock([transaction(1)])
  receipts.get(hash(1, 'd')).status = '0x2'
  await assert.rejects(load(), /Nepoznat status/)
})

test('prekinuti dohvat ne salje nove RPC zahtjeve', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(getLocalWalletHistory(provider, account, controller.signal), { name: 'AbortError' })
  assert.equal(calls.length, 0)
})
