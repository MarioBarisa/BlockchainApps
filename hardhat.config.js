import { defineConfig } from 'hardhat/config'
import hardhatToolboxMochaEthers from '@nomicfoundation/hardhat-toolbox-mocha-ethers'

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    version: '0.8.24',
    settings: { outputSelection: { '*': { '*': ['storageLayout'] } } },
  },
  networks: {
    localhost: { type: 'http', url: 'http://127.0.0.1:8545', chainId: 31337 },
  },
})
