import api from './client'

export interface NFTShare {
  id: number
  token_id: number
  owner_wallet_address: string
  owner_user_id?: number
  share_number: number
  minted_at: string
  contract_address: string
  tx_hash?: string
  block_number?: number
  is_active: boolean
}

export interface MyNFTsResponse {
  nfts: NFTShare[]
  total_rewards: string
  total_rewards_count: number
}

export interface NFTReward {
  id: number
  nft_share_id: number
  period: string
  reward_amount: string
  reward_percentage: string
  total_pool_amount: string
  total_shares: number
  payment_tx_hash?: string
  payment_status: string
  distributed_at?: string
}

export interface NFTStats {
  total_shares: number
  active_shares: number
  total_holders: number
  current_period_pool?: string
  reward_per_share?: string
}

export interface MintNFTRequest {
  wallet_address: string
}

export interface MintNFTResponse {
  nft_share_id: number
  token_id: number
  contract_address: string
  gas_fee_estimate: string
  message: string
}

export const nftApi = {
  // Mint NFT
  mint: async (data: MintNFTRequest) => {
    const response = await api.post<MintNFTResponse>('/nft/mint', data)
    return response.data
  },

  // Confirm mint
  confirmMint: async (nftShareId: number, txHash: string, blockNumber?: number) => {
    const response = await api.post(`/nft/confirm-mint/${nftShareId}`, null, {
      params: { tx_hash: txHash, block_number: blockNumber }
    })
    return response.data
  },

  // Get user's NFTs
  getMyNFTs: async () => {
    const response = await api.get<MyNFTsResponse>('/nft/my-nfts')
    return response.data
  },

  // Get NFT stats
  getStats: async () => {
    const response = await api.get<NFTStats>('/nft/stats')
    return response.data
  },

  // Get user's rewards
  getMyRewards: async () => {
    const response = await api.get<NFTReward[]>('/nft/rewards/my')
    return response.data
  }
}

