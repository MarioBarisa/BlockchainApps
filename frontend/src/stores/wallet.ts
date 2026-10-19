import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { formatEther } from 'ethers'

// Demo podaci - u T4 ih zamjenjuje pravi wallet provider
const MOCK_ADDRESS = '0x7A3f9C2b41D8e6F05aB1c9D4E2f83B6a0C5d19E4'
const MOCK_BALANCE_WEI = 2480000000000000000n

export const useWalletStore = defineStore('wallet', () => {
  const address = ref<string | null>(null)
  const connecting = ref(false)

  const connected = computed(() => address.value !== null)
  const shortAddress = computed(() => {
    if (!address.value) return ''
    return `${address.value.slice(0, 6)}...${address.value.slice(-4)}`
  })
  const balance = computed(() => Number(formatEther(MOCK_BALANCE_WEI)).toFixed(2))

  async function connect() {
    connecting.value = true
    await new Promise((resolve) => setTimeout(resolve, 700))
    address.value = MOCK_ADDRESS
    connecting.value = false
  }

  function disconnect() {
    address.value = null
  }

  return { address, connecting, connected, shortAddress, balance, connect, disconnect }
})
