import { BrowserProvider, Contract, isAddress, isHexString, type Eip1193Provider, type InterfaceAbi } from 'ethers'

export interface TokenSnapshot {
  address: string
  name: string
  symbol: string
  balance: string
  totalSupply: string
  owner: string
  registry: string
}

export async function getLocalToken(provider: Eip1193Provider, account: string): Promise<TokenSnapshot> {
  const response = await fetch(`${import.meta.env?.BASE_URL ?? '/'}deployments/localhost.json`, {
    cache: 'no-store', signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error('Lokalni token nije dostupan. Objavi token i osvjezi podatke.')
  const deployment = await response.json()
  if (deployment.chainId !== 31337 || !isAddress(deployment.address) || !Array.isArray(deployment.abi) ||
      !isHexString(deployment.transactionHash, 32) || !isHexString(deployment.blockHash, 32) ||
      !isHexString(deployment.deployedBytecode) || deployment.deployedBytecode === '0x') {
    throw new Error('Podaci lokalne objave nisu valjani. Ponovi objavu tokena.')
  }

  const rpc = new BrowserProvider(provider)
  try {
    if ((await rpc.getNetwork()).chainId !== 31337n) throw new Error('Odaberi Hardhat mrezu u walletu.')
    const [code, receipt] = await Promise.all([
      rpc.getCode(deployment.address), rpc.getTransactionReceipt(deployment.transactionHash),
    ])
    if (code.toLowerCase() !== deployment.deployedBytecode.toLowerCase() ||
        !receipt || receipt.status !== 1 || receipt.blockHash !== deployment.blockHash ||
        receipt.contractAddress?.toLowerCase() !== deployment.address.toLowerCase()) {
      throw new Error('Lokalna objava vise ne odgovara mrezi. Ponovi objavu tokena i osvjezi podatke.')
    }
    const token = new Contract(deployment.address, deployment.abi as InterfaceAbi, rpc)
    const [name, symbol, decimals, balance, supply, owner, registry] = await Promise.all([
      token.name(), token.symbol(), token.decimals(), token.balanceOf(account),
      token.totalSupply(), token.owner(), token.registry(),
    ])
    if (name !== 'ProofNews Proof' || symbol !== 'PNP' || decimals !== 0n) {
      throw new Error('Ugovor ne odgovara ProofNews tokenu. Ponovi objavu tokena.')
    }
    return { address: deployment.address, name, symbol, balance: balance.toString(), totalSupply: supply.toString(), owner, registry }
  } finally {
    rpc.destroy()
  }
}
