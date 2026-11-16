import { network } from 'hardhat'

const args = process.argv.slice(2)
const amount = args[0] ?? '1'
if (args.length > 1 || !/^\d+(\.\d{1,18})?$/.test(amount) || !/[1-9]/.test(amount)) {
  throw new Error('Koristi npm run fund:local -- IZNOS; iznos mora biti pozitivan broj s najvise 18 decimala')
}

const { ethers } = await network.connect('localhost')
if ((await ethers.provider.getNetwork()).chainId !== 31337n) {
  throw new Error('Financiranje je dopusteno samo na lokalnoj mrezi 31337')
}
const recipient = process.env.RECIPIENT
if (!recipient || !ethers.isAddress(recipient) || recipient === ethers.ZeroAddress) {
  throw new Error('Postavi RECIPIENT na javnu adresu svog walleta')
}
const [sender] = await ethers.getSigners()
const value = ethers.parseEther(amount)
const receipt = await (await sender.sendTransaction({ to: recipient, value })).wait()
if (receipt.status !== 1) throw new Error('Lokalni prijenos nije uspio')
console.log(`Poslano ${ethers.formatEther(value)} lokalnog ETH-a na:`, recipient)
console.log('Transakcija:', receipt.hash)
