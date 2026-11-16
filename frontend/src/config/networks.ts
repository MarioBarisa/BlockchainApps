export const networks = {
  sepolia: {
    name: 'Sepolia',
    chainId: 11155111,
    currencyLabel: 'Sepolia ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: '',
  },
  hardhat: {
    name: 'Hardhat localhost',
    chainId: 31337,
    currencyLabel: 'Lokalni ETH',
    explorerUrl: '',
    rpcUrl: 'http://127.0.0.1:8545',
  },
}

export type NetworkKey = keyof typeof networks
