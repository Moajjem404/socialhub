'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Filter,
  Search,
  Ban,
  TrendingUp,
  TrendingDown,
  Heart,
  ThumbsUp,
  Smile,
  Frown,
  Angry,
  Laugh,
  Shield,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import toast from 'react-hot-toast'

interface Reaction {
  _id: string
  name: string
  user_id: string
  reaction_type: 'LIKE' | 'LOVE' | 'ANGRY' | 'HAHA' | 'SAD' | 'WOW'
  post_url?: string
  post_id?: string
  action_type: string
  previous_reaction?: string
  custom_action?: string
  createdAt: string
}

interface ReactionStats {
  totalReactions: number
  reactionsByType: Array<{ _id: string; count: number }>
  topUsers: Array<{ _id: string; count: number; name: string }>
  topPosts: Array<{ _id: string; count: number; post_url: string }>
}

interface UserBan {
  _id: string
  user_id: string
  user_name: string
  ban_type: 'REACTION' | 'COMMENT' | 'ALL'
  reason: string
  banned_by: string
  isActive: boolean
  createdAt: string
}

interface BanResponse {
  success: boolean
  message: string
  existing_ban?: {
    ban_id: string
    ban_type: string
    reason: string
    banned_by: string
    banned_at: string
  }
  can_remove_data?: boolean
  data?: UserBan
}

export default function ReactionManagement() {
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [stats, setStats] = useState<ReactionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [banModal, setBanModal] = useState<{ user_id: string; user_name: string } | null>(null)
  
  // Ban management states
  const [banType, setBanType] = useState<'REACTION' | 'COMMENT' | 'ALL'>('REACTION')
  const [banReason, setBanReason] = useState('')
  const [removeAllData, setRemoveAllData] = useState(true) // Default checked
  const [alreadyBannedUser, setAlreadyBannedUser] = useState<BanResponse | null>(null)
  const [removeDataModal, setRemoveDataModal] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const { socket } = useSocket()

  useEffect(() => {
    fetchReactions()
    fetchStats()
    
    if (socket) {
      socket.on('new_reaction', (reaction) => {
        setReactions(prev => [reaction, ...prev])
        toast.success('New reaction received!')
        fetchStats()
      })
    }

    return () => {
      if (socket) {
        socket.off('new_reaction')
      }
    }
  }, [socket, page])

  const fetchReactions = async () => {
    try {
      const response = await apiService.getReactions(page, 50)
      if (response.success) {
        setReactions(response.data as Reaction[])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getReactionStats()
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching reaction stats:', error)
    }
  }

  const handleBanUser = async (user_id: string, user_name: string) => {
    setBanModal({ user_id, user_name })
  }

  const confirmBanUser = async () => {
    if (!banModal || !banReason) return
    
    try {
      console.log('🚫 Banning user:', {
        user_id: banModal.user_id,
        user_name: banModal.user_name,
        ban_type: banType,
        reason: banReason
      })
      
      const result = await apiService.banUser({
        user_id: banModal.user_id,
        user_name: banModal.user_name,
        ban_type: banType,
        reason: banReason,
        banned_by: 'admin'
      })
      
      console.log('✅ Ban result:', result)
      
      if (result.success === false && result.existing_ban) {
        // User already banned
        setAlreadyBannedUser(result)
        toast.error('This user is already banned')
      } else if (result.success === true) {
        // Successfully banned
        toast.success(`User ${banModal.user_name} banned successfully`)
        
        // If remove all data is checked, remove all data
        if (removeAllData) {
          try {
            console.log('🗑️ Removing all data for user:', banModal.user_id)
            const removeResult = await apiService.removeUserData(
              banModal.user_id,
              `Data removed during ban: ${banReason}`,
              'admin'
            ) as any
            
            console.log('✅ Data removal result:', removeResult)
            toast.success(`Also removed ${removeResult.total_removed || 0} items for user ${banModal.user_name}`)
          } catch (error: any) {
            console.error('❌ Error removing user data:', error)
            toast.error('Failed to remove user data: ' + (error.message || 'Unknown error'))
          }
        }
        
        setBanModal(null)
        setBanReason('')
        setBanType('REACTION')
        setRemoveAllData(true)
      }
    } catch (error: any) {
      console.error('❌ Error banning user:', error)
      toast.error(`Failed to ban user: ${error.message || 'Network error'}`)
    }
  }

  const handleRemoveAllData = async () => {
    if (!removeDataModal || !removeReason) return
    
    try {
      const result = await apiService.removeUserData(
        removeDataModal,
        removeReason,
        'admin'
      ) as any
      
      toast.success(`Removed ${result.total_removed || 0} items for user ${removeDataModal}`)
      setRemoveDataModal(null)
      setRemoveReason('')
      setAlreadyBannedUser(null)
      fetchReactions()
      fetchStats()
    } catch (error: any) {
      console.error('Error removing user data:', error)
      toast.error('Failed to remove user data: ' + (error.message || 'Unknown error'))
    }
  }

  const getReactionIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <ThumbsUp className="w-4 h-4" />
      case 'LOVE': return <Heart className="w-4 h-4" />
      case 'HAHA': return <Laugh className="w-4 h-4" />
      case 'SAD': return <Frown className="w-4 h-4" />
      case 'ANGRY': return <Angry className="w-4 h-4" />
      case 'WOW': return <Smile className="w-4 h-4" />
      default: return <ThumbsUp className="w-4 h-4" />
    }
  }

  const getReactionColor = (type: string) => {
    switch (type) {
      case 'LIKE': return 'text-blue-600 bg-blue-100'
      case 'LOVE': return 'text-red-600 bg-red-100'
      case 'HAHA': return 'text-yellow-600 bg-yellow-100'
      case 'SAD': return 'text-gray-600 bg-gray-100'
      case 'ANGRY': return 'text-red-600 bg-red-100'
      case 'WOW': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredReactions = reactions.filter(reaction => {
    const matchesSearch = reaction.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reaction.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || reaction.reaction_type === filterType
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">Reaction Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Monitor and manage user reactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="page-content">
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
        >
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Reactions</p>
                <p className="stat-number">{stats?.totalReactions || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Most Popular</p>
                <p className="stat-number text-lg">
                  {stats?.reactionsByType?.[0]?._id || 'N/A'}
                </p>
                <p className="stat-change-positive">
                  {stats?.reactionsByType?.[0]?.count || 0} reactions
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Top User</p>
                <p className="stat-number text-lg">
                  {stats?.topUsers?.[0]?.name?.substring(0, 8) || 'N/A'}
                </p>
                <p className="stat-change-positive">
                  {stats?.topUsers?.[0]?.count || 0} reactions
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Reaction Types</p>
                <p className="stat-number">{stats?.reactionsByType?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input"
              >
                <option value="ALL">All Types</option>
                <option value="LIKE">Like</option>
                <option value="LOVE">Love</option>
                <option value="HAHA">Haha</option>
                <option value="SAD">Sad</option>
                <option value="ANGRY">Angry</option>
                <option value="WOW">Wow</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reactions List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="mobile-heading font-semibold text-gray-900">
              Recent Reactions ({filteredReactions.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredReactions.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reactions found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredReactions.map((reaction, index) => (
                <motion.div
                  key={reaction._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getReactionColor(reaction.reaction_type)}`}>
                        {getReactionIcon(reaction.reaction_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {reaction.name || 'Unknown User'}
                          </h3>
                          <span className="badge-primary text-xs">
                            {reaction.reaction_type}
                          </span>
                          <span className={`badge ${reaction.action_type === 'ADDED' ? 'badge-success' : 'badge-warning'} text-xs`}>
                            {reaction.action_type}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">
                          User ID: {reaction.user_id}
                        </p>
                        {reaction.post_url && (
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            Post: {reaction.post_url}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(reaction.createdAt).toLocaleString()}
                          </span>
                          {reaction.previous_reaction && (
                            <span className="text-xs text-gray-500">
                              Previous: {reaction.previous_reaction}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:ml-4">
                      <button
                        onClick={() => handleBanUser(reaction.user_id, reaction.name || 'Unknown')}
                        className="btn-danger flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                      >
                        <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Ban User</span>
                        <span className="sm:hidden">Ban</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Ban User Modal */}
      {banModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Ban className="w-6 h-6 text-red-600" />
                <span>Ban User</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ban user: {banModal.user_name} (ID: {banModal.user_id})
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="label">Ban Type</label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value as 'REACTION' | 'COMMENT' | 'ALL')}
                  className="input"
                >
                  <option value="REACTION">Reactions Only</option>
                  <option value="COMMENT">Comments Only</option>
                  <option value="ALL">All Activities</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="label">Ban Reason</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Enter ban reason..."
                  required
                />
              </div>

              <div className="mb-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="removeAllData"
                    checked={removeAllData}
                    onChange={(e) => setRemoveAllData(e.target.checked)}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <div className="flex-1">
                    <label htmlFor="removeAllData" className="text-sm font-medium text-gray-900 cursor-pointer">
                      Remove All User Data
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      This will permanently delete all reactions, comments, and orders for this user. 
                      Ban history will be preserved for future unbanning.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setBanModal(null)
                    setBanReason('')
                    setBanType('REACTION')
                    setRemoveAllData(true)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBanUser}
                  disabled={!banReason.trim()}
                  className="btn-danger disabled:opacity-50"
                >
                  Ban User
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Already Banned User Modal */}
      {alreadyBannedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <span>User Already Banned</span>
              </h2>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>This user is already banned!</strong>
                </p>
                <div className="mt-2 text-sm text-yellow-700">
                  <p><strong>Ban Type:</strong> {alreadyBannedUser.existing_ban?.ban_type}</p>
                  <p><strong>Reason:</strong> {alreadyBannedUser.existing_ban?.reason}</p>
                  <p><strong>Banned By:</strong> {alreadyBannedUser.existing_ban?.banned_by}</p>
                  <p><strong>Banned At:</strong> {new Date(alreadyBannedUser.existing_ban?.banned_at || '').toLocaleString()}</p>
                </div>
              </div>
              
              {alreadyBannedUser.can_remove_data && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>Remove All Data Option:</strong>
                  </p>
                  <p className="text-sm text-red-700">
                    You can remove all data (reactions, comments, orders) for this user.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setAlreadyBannedUser(null)
                    setBanModal(null)
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
                {alreadyBannedUser.can_remove_data && (
                  <button
                    onClick={() => {
                      setRemoveDataModal(banModal?.user_id || '')
                      setAlreadyBannedUser(null)
                    }}
                    className="btn-danger flex items-center space-x-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove All Data</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Remove All Data Modal */}
      {removeDataModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Trash2 className="w-6 h-6 text-red-600" />
                <span>Remove All User Data</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                User ID: {removeDataModal}
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This action will permanently remove all data for this user including:
                </p>
                <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                  <li>All reactions</li>
                  <li>All comments</li>
                  <li>All orders</li>
                </ul>
                <p className="text-sm text-red-800 mt-2">
                  <strong>This action cannot be undone!</strong>
                </p>
              </div>
              
              <div className="mb-4">
                <label className="label">Removal Reason</label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Enter reason for removing all data..."
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setRemoveDataModal(null)
                    setRemoveReason('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveAllData}
                  disabled={!removeReason.trim()}
                  className="btn-danger disabled:opacity-50 flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Remove All Data</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
