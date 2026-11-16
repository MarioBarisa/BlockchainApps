import { network } from 'hardhat'

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

console.log('Token objavljen na adresi:', await token.getAddress())
console.log('Vlasnik:', owner.address)
console.log('Chain ID:', chain.chainId.toString())
console.log('Transakcija:', receipt.hash)
console.log('Blok:', receipt.blockNumber)
console.log('Hash bloka:', block.hash)
console.log('Gas:', receipt.gasUsed.toString())
console.log('Status:', receipt.status)
console.log('Registar:', await token.registry())
