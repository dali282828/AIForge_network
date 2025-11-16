import { useState, useEffect } from 'react'
import { nftApi, NFTShare, NFTReward, NFTStats } from '../api/nft'
import ComingSoon from '../components/ComingSoon'

export default function NFT() {
  const [nfts, setNfts] = useState<NFTShare[]>([])
  const [rewards, setRewards] = useState<NFTReward[]>([])
  const [stats, setStats] = useState<NFTStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [minting, setMinting] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [nftsData, rewardsData, statsData] = await Promise.all([
        nftApi.getMyNFTs(),
        nftApi.getMyRewards(),
        nftApi.getStats()
      ])
      setNfts(nftsData.nfts)
      setRewards(rewardsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load NFT data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMint = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter your Tron wallet address')
      return
    }

    if (!walletAddress.startsWith('T')) {
      alert('Invalid Tron wallet address. Must start with "T"')
      return
    }

    try {
      setMinting(true)
      const result = await nftApi.mint({ wallet_address: walletAddress })
      alert(result.message)
      await loadData()
    } catch (error: any) {
      console.error('Failed to mint NFT:', error)
      alert(error.response?.data?.detail || 'Failed to mint NFT')
    } finally {
      setMinting(false)
    }
  }

  const totalRewards = rewards.reduce((sum, r) => sum + parseFloat(r.reward_amount || '0'), 0)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">NFT Shares</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Shares</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_shares}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Holders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_holders}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Current Pool</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.current_period_pool || '0.00'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Reward/Share</p>
            <p className="text-2xl font-bold text-gray-900">
              ${stats.reward_per_share || '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Mint NFT Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Mint NFT Share</h2>
        <p className="text-gray-600 mb-4">
          Mint an NFT share to become a platform shareholder. You'll receive rewards from 30% of subscription revenue and 10% of API revenue.
        </p>
        <div className="flex space-x-2">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter your Tron wallet address (starts with T)"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleMint}
            disabled={minting || !walletAddress.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {minting ? 'Minting...' : 'Mint NFT ($0.10)'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Cost: $0.10 gas fee (paid directly to Tron network)
        </p>
      </div>

      {/* My NFTs */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My NFTs</h2>
        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : nfts.length === 0 ? (
          <p className="text-gray-600">You don't have any NFTs yet. Mint one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nfts.map((nft) => (
              <div key={nft.id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Share #{nft.share_number}</p>
                <p className="text-lg font-semibold text-gray-900">Token ID: {nft.token_id}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Minted: {new Date(nft.minted_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Wallet: {nft.owner_wallet_address.slice(0, 8)}...{nft.owner_wallet_address.slice(-6)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Coin Rewards - Coming Soon */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Platform Coin Rewards</h2>
          <ComingSoon feature="Platform Coin" size="sm" />
        </div>
        <ComingSoon
          feature="Earn Platform Coins with NFTs"
          description="In the future, NFT holders will earn platform-native coins instead of USDT. Coins will be used for all rewards, staking, and governance. Currently earning USDT rewards (v1.0)."
          variant="card"
        />
      </div>

      {/* Rewards */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Rewards</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">Total Rewards</p>
          <p className="text-3xl font-bold text-green-600">${totalRewards.toFixed(2)}</p>
        </div>
        {rewards.length === 0 ? (
          <p className="text-gray-600">No rewards yet. Rewards are distributed monthly.</p>
        ) : (
          <div className="space-y-2">
            {rewards.map((reward) => (
              <div key={reward.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">Period: {reward.period}</p>
                    <p className="text-sm text-gray-600">
                      {reward.reward_percentage}% of pool
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      ${parseFloat(reward.reward_amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {reward.payment_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

