import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { moduleUrl } from './moduleUrl.mjs'

const historyUrl = moduleUrl('../src/services/walletHistory.ts')
const networksUrl = moduleUrl('../src/config/networks.ts')
const tokenUrl = moduleUrl('../src/services/proofNewsToken.ts')
const localHistoryUrl = moduleUrl('../src/services/localWalletHistory.ts', { '@/services/walletHistory': historyUrl })
const { getWalletHistory } = await import(historyUrl)
const { useWalletStore } = await import(moduleUrl('../src/stores/wallet.ts', {
  '@/config/networks': networksUrl,
  '@/services/proofNewsToken': tokenUrl,
  '@/services/walletHistory': historyUrl,
  '@/services/localWalletHistory': localHistoryUrl,
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
let switchError
let addedNetworks
let receiptRequests
let sendError
let accountError
let permissionError
let permissionRequests
let grantOnAccountRequest
let afterEstimate
let localBlocks
let localReceipts
let latestBlockHook

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

function localBlock(number, transactions = [], marker = 'a') {
  return {
    hash: `0x${marker}${number.toString(16).padStart(63, '0')}`, parentHash: hash('b'),
    number: `0x${number.toString(16)}`, timestamp: `0x${(1800000000 + number).toString(16)}`,
    transactions, nonce: '0x0000000000000000', difficulty: '0x0', gasLimit: '0x1c9c380',
    gasUsed: '0x5208', miner: account, extraData: '0x', baseFeePerGas: '0x3b9aca00',
  }
}

function addLocalTransfer(digit, from = other, to = account) {
  const tx = { hash: hash(digit), from, to, value: '0x2386f26fc10000' }
  const block = localBlock(localBlocks.length, [tx])
  localBlocks.push(block)
  localReceipts.set(tx.hash, { status: '0x1', blockHash: block.hash, gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00', contractAddress: null })
  return tx
}

beforeEach(() => {
  accounts = [account]
  network = '0xaa36a7'
  listeners = new Map()
  receipt = null
  sendCount = 0
  switchError = null
  addedNetworks = []
  receiptRequests = 0
  sendError = null
  accountError = null
  permissionError = null
  permissionRequests = 0
  grantOnAccountRequest = false
  afterEstimate = null
  localBlocks = [localBlock(0)]
  localReceipts = new Map()
  latestBlockHook = null
  fetchHandler = async () => response(page())
  globalThis.fetch = (...args) => fetchHandler(...args)
  globalThis.window = { ethereum: {
    on: (event, listener) => listeners.set(event, listener),
    removeListener: (event) => listeners.delete(event),
    async request({ method, params }) {
      if (method === 'eth_accounts') {
        if (accountError) throw accountError
        return accounts
      }
      if (method === 'eth_requestAccounts') {
        if (grantOnAccountRequest) sendError = null
        return accounts
      }
      if (method === 'wallet_requestPermissions') {
        permissionRequests++
        assert.deepEqual(params, [{ eth_accounts: {} }])
        if (permissionError) throw permissionError
        sendError = null
        return [{ parentCapability: 'eth_accounts' }]
      }
      if (method === 'eth_chainId') return network
      if (method === 'eth_getBalance') return '0xde0b6b3a7640000'
      if (method === 'wallet_switchEthereumChain') {
        if (switchError) throw switchError
        network = params[0].chainId
        listeners.get('chainChanged')?.()
        return null
      }
      if (method === 'wallet_addEthereumChain') {
        addedNetworks.push(params[0])
        switchError = null
        return null
      }
      if (method === 'eth_getTransactionReceipt') { receiptRequests++; return localReceipts.get(params[0]) ?? receipt }
      if (method === 'eth_estimateGas') { afterEstimate?.(); return '0x5208' }
      if (method === 'eth_gasPrice' || method === 'eth_maxPriorityFeePerGas') return '0x3b9aca00'
      if (method === 'eth_blockNumber') return '0x10'
      if (method === 'eth_getBlockByNumber' && network === '0x7a69') {
        if (params[0] === 'latest' && latestBlockHook) return latestBlockHook()
        const block = params[0] === 'latest' ? localBlocks.at(-1) : localBlocks[Number(BigInt(params[0]))] ?? null
        return block && !params[1] ? { ...block, transactions: block.transactions.map((tx) => tx.hash) } : block
      }
      if (method === 'eth_getBlockByNumber') return {
        hash: hash('a'), parentHash: hash('b'), number: '0x10', timestamp: '0x1234', nonce: '0x0000000000000000',
        difficulty: '0x0', gasLimit: '0x1c9c380', gasUsed: '0x5208', miner: account,
        extraData: '0x', transactions: [], baseFeePerGas: '0x3b9aca00',
      }
      if (method === 'eth_sendTransaction') {
        sendCount++
        if (sendError) throw sendError
        assert.equal(params[0].chainId, network)
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

test('Hardhat ucitava ETH bez Blockscout zahtjeva i prijavljuje nedostajuci token', async () => {
  let calls = 0
  fetchHandler = async (url) => {
    calls++
    assert.equal(url, '/deployments/localhost.json')
    return new Response('', { status: 404 })
  }
  network = '0x7a69'
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  assert.equal(wallet.isCorrectNetwork, true)
  assert.equal(wallet.balance, '1.0')
  assert.match(wallet.tokenError, /Objavi token/)
  assert.equal(wallet.token, null)
  await flush()
  assert.equal(wallet.historyLoaded, true)
  assert.equal(wallet.historyError, '')
  await wallet.loadHistory()
  assert.equal(calls, 1)
})

test('promjena mreze razdvaja transakcije cak i kada imaju isti hash', async () => {
  await wallet.connect()
  await flush()
  assert.equal(await wallet.send(other, '0.001'), true)
  const sepoliaRequests = receiptRequests
  fetchHandler = async (url) => typeof url === 'string'
    ? new Response('', { status: 404 }) : response(page())
  await wallet.selectNetwork('hardhat')
  assert.equal(wallet.activity.length, 0)
  assert.equal(receiptRequests, sepoliaRequests)
  assert.equal(await wallet.send(other, '0.002'), true)
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].amount, '0.002')
  receipt = { status: '0x1', gasUsed: '0x5208', effectiveGasPrice: '0x3b9aca00' }
  await wallet.refresh()
  assert.equal(wallet.activity[0].status, 'confirmed')
  receipt = null
  await wallet.selectNetwork('sepolia')
  await flush()
  assert.equal(wallet.token, null)
  assert.equal(wallet.tokenError, '')
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].amount, '0.001')
  assert.equal(wallet.activity[0].status, 'pending')
})

test('wallet dodaje Hardhat samo nakon korisnikova odabira i potvrde', async () => {
  switchError = { code: 4902 }
  fetchHandler = async () => new Response('', { status: 404 })
  await wallet.selectNetwork('hardhat')
  assert.equal(addedNetworks.length, 0)
  await wallet.connect()
  assert.equal(addedNetworks.length, 1)
  assert.equal(addedNetworks[0].chainId, '0x7a69')
  assert.deepEqual(addedNetworks[0].rpcUrls, ['http://127.0.0.1:8545'])
  assert.equal(wallet.isCorrectNetwork, true)
})

test('odbijena promjena mreze uklanja saldo i blokira slanje', async () => {
  await wallet.connect()
  await flush()
  switchError = { code: 4001 }
  await wallet.selectNetwork('hardhat')
  assert.equal(wallet.balance, '—')
  assert.equal(wallet.isCorrectNetwork, false)
  assert.match(wallet.error, /odbijen/)
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(sendCount, 0)
})

test('zakasnjeli rezultat tokena ne prepisuje stanje drugog racuna', async () => {
  network = '0x7a69'
  await wallet.selectNetwork('hardhat')
  let resolveFirst
  fetchHandler = () => new Promise((resolve) => { resolveFirst = resolve })
  const connecting = wallet.connect()
  await flush()
  fetchHandler = async () => new Response('', { status: 404 })
  accounts = [other]
  listeners.get('accountsChanged')()
  await flush()
  assert.match(wallet.tokenError, /Objavi token/)
  resolveFirst(response({ chainId: 4 }))
  await connecting
  assert.equal(wallet.address.toLowerCase(), other)
  assert.match(wallet.tokenError, /Objavi token/)
  assert.equal(wallet.token, null)
})

test('4100 pri slanju omogucuje ponovnu autorizaciju bez automatskog ponavljanja transakcije', async () => {
  await wallet.connect()
  await flush()
  sendError = { code: 4100, message: 'Unauthorized' }
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(wallet.authorizationRequired, true)
  assert.match(wallet.error, /Ponovno odobri wallet/)
  assert.equal(wallet.activity.length, 0)
  assert.equal(sendCount, 1)
  assert.equal(permissionRequests, 0)
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(sendCount, 1)
  assert.equal(await wallet.reauthorize(), true)
  assert.equal(permissionRequests, 1)
  assert.equal(wallet.authorizationRequired, false)
  assert.equal(wallet.error, '')
  assert.equal(sendCount, 1)
  assert.equal(await wallet.send(other, '0.001'), true)
  assert.equal(sendCount, 2)
})

test('raw 4100 pri provjeri racuna blokira slanje i pokazuje uputu za dozvolu', async () => {
  await wallet.connect()
  await flush()
  accountError = { code: 4100 }
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(wallet.authorizationRequired, true)
  assert.match(wallet.error, /MetaMask nije odobrio/)
  assert.equal(sendCount, 0)
})

test('prepoznaje 4100 i kada je zapakiran u originalError', async () => {
  await wallet.connect()
  await flush()
  accountError = { code: -32603, data: { originalError: { code: 4100 } } }
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(wallet.authorizationRequired, true)
  assert.equal(sendCount, 0)
})

test('odbijena ponovna autorizacija ostavlja slanje blokiranim', async () => {
  await wallet.connect()
  await flush()
  sendError = { code: 4100 }
  await wallet.send(other, '0.001')
  permissionError = { code: 4001 }
  assert.equal(await wallet.reauthorize(), false)
  assert.equal(wallet.authorizationRequired, true)
  assert.match(wallet.error, /odbijen/)
  assert.equal(sendCount, 1)
})

test('wallet bez requestPermissions koristi eth_requestAccounts bez automatskog slanja', async () => {
  await wallet.connect()
  await flush()
  sendError = { code: 4100 }
  await wallet.send(other, '0.001')
  permissionError = { code: 4200 }
  grantOnAccountRequest = true
  assert.equal(await wallet.reauthorize(), true)
  assert.equal(wallet.authorizationRequired, false)
  assert.equal(sendCount, 1)
})

test('promjena racuna bez eventa ne salje s ranije spremljene adrese', async () => {
  await wallet.connect()
  await flush()
  accounts = [other]
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(sendCount, 0)
  assert.equal(wallet.address.toLowerCase(), other)
  assert.match(wallet.error, /promijenjeni/)
})

test('promjena mreze bez eventa blokira slanje prije procjene naknade', async () => {
  await wallet.connect()
  await flush()
  network = '0x1'
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(sendCount, 0)
  assert.equal(wallet.isCorrectNetwork, false)
})

test('ponovno provjerava racun nakon procjene naknade', async () => {
  await wallet.connect()
  await flush()
  afterEstimate = () => { accounts = [other] }
  assert.equal(await wallet.send(other, '0.001'), false)
  assert.equal(sendCount, 0)
  assert.equal(wallet.address.toLowerCase(), other)
})

test('lokalna povijest ukljucuje ranije uplate i slanja izvan aplikacije i nakon novog spajanja', async () => {
  network = '0x7a69'
  fetchHandler = async () => new Response('', { status: 404 })
  addLocalTransfer('1')
  addLocalTransfer('2', account, other)
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  await flush()
  assert.equal(wallet.historyLoaded, true)
  assert.deepEqual(wallet.activity.map((tx) => tx.hash), [hash('2'), hash('1')])
  assert.equal(wallet.activity[1].amount, '0.01')
  assert.equal(wallet.activity[1].fee, '0.000021')
  wallet.disconnect()
  setActivePinia(createPinia())
  wallet = useWalletStore()
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  await flush()
  assert.equal(wallet.activity.length, 2)
})

test('osvjezavanje walleta pronalazi novu vanjsku uplatu bez promjene sesije', async () => {
  network = '0x7a69'
  fetchHandler = async () => new Response('', { status: 404 })
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  await flush()
  assert.equal(wallet.activity.length, 0)
  addLocalTransfer('3')
  await wallet.refresh()
  await flush()
  assert.equal(wallet.activity.length, 1)
  assert.equal(wallet.activity[0].hash, hash('3'))
  assert.equal(wallet.historyError, '')
})

test('reset lokalnog cvora uklanja staru povijest i stare transakcije sesije', async () => {
  network = '0x7a69'
  fetchHandler = async () => new Response('', { status: 404 })
  addLocalTransfer('1')
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  await flush()
  assert.equal(await wallet.send(other, '0.001'), true)
  await flush()
  assert.equal(wallet.activity.length, 2)
  localBlocks = [localBlock(0, [], 'b')]
  localReceipts.clear()
  await wallet.refresh()
  await flush()
  assert.equal(wallet.activity.length, 0)
  assert.equal(wallet.historyLoaded, true)
  assert.equal(wallet.historyError, '')
})

test('zakasnjeli lokalni blok ne prepisuje povijest drugog racuna', async () => {
  network = '0x7a69'
  fetchHandler = async () => new Response('', { status: 404 })
  addLocalTransfer('1', '0x3333333333333333333333333333333333333333', account)
  let resolveBlock
  latestBlockHook = () => new Promise((resolve) => { resolveBlock = resolve })
  await wallet.selectNetwork('hardhat')
  await wallet.connect()
  assert.equal(wallet.historyLoading, true)
  latestBlockHook = null
  accounts = [other]
  listeners.get('accountsChanged')()
  await flush()
  assert.equal(wallet.historyLoaded, true)
  resolveBlock(localBlocks.at(-1))
  await flush()
  assert.equal(wallet.address.toLowerCase(), other)
  assert.equal(wallet.activity.length, 0)
  assert.equal(wallet.historyError, '')
})
