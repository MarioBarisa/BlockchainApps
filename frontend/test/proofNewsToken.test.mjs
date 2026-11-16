import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { Interface, ZeroAddress } from 'ethers'
import { moduleUrl } from './moduleUrl.mjs'

const { getLocalToken } = await import(moduleUrl('../src/services/proofNewsToken.ts'))
const originalFetch = globalThis.fetch
const account = '0x1111111111111111111111111111111111111111'
const address = '0x2222222222222222222222222222222222222222'
const hash = '0x' + 'a'.repeat(64)
const blockHash = '0x' + 'b'.repeat(64)
const abi = [
  'function name() view returns (string)', 'function symbol() view returns (string)',
  'function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)',
  'function totalSupply() view returns (uint256)', 'function owner() view returns (address)',
  'function registry() view returns (address)',
]
const contract = new Interface(abi)
let deployment, values, code, receiptBlockHash, chainId, calls
const provider = {
  async request({ method, params }) {
    calls.push(method)
    if (method === 'eth_chainId') return chainId
    if (method === 'eth_blockNumber') return '0x1'
    if (method === 'eth_getCode') return code
    if (method === 'eth_getTransactionReceipt') return {
      transactionHash: hash, blockHash: receiptBlockHash, blockNumber: '0x1', transactionIndex: '0x0',
      from: account, to: null, contractAddress: address, status: '0x1', type: '0x2',
      gasUsed: '0x10000', cumulativeGasUsed: '0x10000', effectiveGasPrice: '0x1',
      logs: [], logsBloom: '0x' + '0'.repeat(512),
    }
    if (method === 'eth_call') {
      const fn = contract.parseTransaction({ data: params[0].data })
      if (fn.name === 'balanceOf') assert.equal(fn.args[0].toLowerCase(), account)
      return contract.encodeFunctionResult(fn.name, [values[fn.name]])
    }
    throw new Error(`Nepoznat RPC: ${method}`)
  },
}

beforeEach(() => {
  deployment = { chainId: 31337, address, transactionHash: hash, blockHash, deployedBytecode: '0x6000', abi }
  values = { name: 'ProofNews Proof', symbol: 'PNP', decimals: 0n, balanceOf: 2n, totalSupply: 3n, owner: account, registry: ZeroAddress }
  code = '0x6000'
  receiptBlockHash = blockHash
  chainId = '0x7a69'
  calls = []
  globalThis.fetch = async () => new Response(JSON.stringify(deployment))
})
afterEach(() => { globalThis.fetch = originalFetch })

test('cita PNP saldo i podatke iz ugovora prema ABI-ju objave', async () => {
  const result = await getLocalToken(provider, account)
  assert.deepEqual(result, { address, name: 'ProofNews Proof', symbol: 'PNP', balance: '2', totalSupply: '3', owner: account, registry: ZeroAddress })
})

test('ne tumaci nedostajucu objavu kao nulti saldo', async () => {
  globalThis.fetch = async () => new Response('', { status: 404 })
  await assert.rejects(getLocalToken(provider, account), /Objavi token/)
  assert.equal(calls.length, 0)
})

test('odbija objavu drugog lanca i neispravnu adresu prije RPC poziva', async () => {
  deployment.chainId = 1
  await assert.rejects(getLocalToken(provider, account), /nisu valjani/)
  deployment.chainId = 31337
  deployment.address = 'nije-adresa'
  await assert.rejects(getLocalToken(provider, account), /nisu valjani/)
  assert.equal(calls.length, 0)
})

test('ne cita ugovor dok je wallet na drugoj mrezi', async () => {
  chainId = '0xaa36a7'
  await assert.rejects(getLocalToken(provider, account), /Odaberi Hardhat/)
  assert.equal(calls.includes('eth_call'), false)
})

test('odbija nestali ili zamijenjeni kod nakon reseta lokalnog cvora', async () => {
  for (const wrongCode of ['0x', '0x6001']) {
    code = wrongCode
    await assert.rejects(getLocalToken(provider, account), /Ponovi objavu/)
  }
  assert.equal(calls.includes('eth_call'), false)
})

test('odbija stari receipt i kad su adresa i kod nakon reseta jednaki', async () => {
  receiptBlockHash = '0x' + 'c'.repeat(64)
  await assert.rejects(getLocalToken(provider, account), /Ponovi objavu/)
  assert.equal(calls.includes('eth_call'), false)
})

test('odbija token s drugacijim metapodacima ili decimalama', async () => {
  values.decimals = 18n
  await assert.rejects(getLocalToken(provider, account), /ne odgovara ProofNews/)
})
