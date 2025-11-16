// TronLink type definitions
interface TronWeb {
  defaultAddress: {
    base58: string
    hex: string
  }
  trx: {
    signMessage: (message: string) => Promise<string>
    sendTransaction: (transaction: any) => Promise<any>
    getBalance: (address: string) => Promise<number>
  }
  request: (options: { method: string; params?: any }) => Promise<any>
  isConnected: () => boolean
}

interface Window {
  tronWeb?: TronWeb
  tronLink?: {
    ready: boolean
    tronWeb?: TronWeb
  }
}

