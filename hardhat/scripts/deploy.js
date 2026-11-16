import { network, artifacts } from 'hardhat'
import { mkdir, writeFile } from 'node:fs/promises'

const { ethers } = await network.connect()
const chain = await ethers.provider.getNetwork()
if (chain.chainId !== 31337n) {
  throw new Error('Ova skripta objavljuje token samo na lokalnoj mrezi 31337')
}

const [owner] = await ethers.getSigners()
const token = await ethers.deployContract('ProofNewsToken')
await token.waitForDeployment()
const receipt = await token.deploymentTransaction().wait()
if (receipt.status !== 1) throw new Error('Objava tokena nije uspjela')
const block = await ethers.provider.getBlock(receipt.blockNumber)
const artifact = await artifacts.readArtifact('ProofNewsToken')
const deploymentDirectory = new URL('../../frontend/public/deployments/', import.meta.url)
await mkdir(deploymentDirectory, { recursive: true })
await writeFile(new URL('localhost.json', deploymentDirectory), JSON.stringify({
  chainId: Number(chain.chainId),
  address: await token.getAddress(),
  transactionHash: receipt.hash,
  blockHash: block.hash,
  abi: artifact.abi,
  deployedBytecode: artifact.deployedBytecode,
}, null, 2) + '\n')

console.log('Token objavljen na adresi:', await token.getAddress())
console.log('Vlasnik:', owner.address)
console.log('Chain ID:', chain.chainId.toString())
console.log('Transakcija:', receipt.hash)
console.log('Blok:', receipt.blockNumber)
console.log('Hash bloka:', block.hash)
console.log('Gas:', receipt.gasUsed.toString())
console.log('Status:', receipt.status)
console.log('Registar:', await token.registry())
console.log('Podaci objave spremljeni za frontend.')
