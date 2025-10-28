'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Ban, 
  UserCheck, 
  Search,
  AlertTriangle,
  Trash2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

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

interface BanStats {
  totalBanned: number
  reactionBans: number
  commentBans: number
  allBans: number
  recentBans: number
}

export default function BanManagement() {
  const [userId, setUserId] = useState('')
  const [userName, setUserName] = useState('')
  const [banType, setBanType] = useState<'REACTION' | 'COMMENT' | 'ALL'>('ALL')
  const [banReason, setBanReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<BanStats | null>(null)
  const [bannedUsers, setBannedUsers] = useState<UserBan[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [alreadyBannedUser, setAlreadyBannedUser] = useState<BanResponse | null>(null)
  const [removeDataModal, setRemoveDataModal] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const [unbanModal, setUnbanModal] = useState<UserBan | null>(null)

  useEffect(() => {
    fetchBanStats()
    fetchBannedUsers()
  }, [page])

  const fetchBanStats = async () => {
    try {
      const { apiService } = await import('@/lib/api')
      const result = await apiService.getBanStats()
      if (result.success) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error('Error fetching ban stats:', error)
    }
  }

  const fetchBannedUsers = async () => {
    try {
      const { apiService } = await import('@/lib/api')
      const result = await apiService.getBannedUsers(page, 20)
      if (result.success) {
        setBannedUsers(result.data as UserBan[])
        setTotalPages(result.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching banned users:', error)
    }
  }

  const handleBanUser = async () => {
    if (!userId || !banReason) {
      toast.error('User ID and ban reason are required')
      return
    }

    setLoading(true)
    try {
      // Get current admin info
      const adminUser = typeof window !== 'undefined' ? localStorage.getItem('admin_user') : null
      const currentAdmin = adminUser ? JSON.parse(adminUser) : null
      
      console.log('🚫 Banning user:', {
        user_id: userId,
        user_name: userName || userId,
        ban_type: banType,
        reason: banReason,
        banned_by: currentAdmin?.username || 'admin'
      })
      
      // Import the API service
      const { apiService } = await import('@/lib/api')
      
      // Use the API service to ban the user
      const result = await apiService.banUser({
        user_id: userId,
        user_name: userName || userId,
        ban_type: banType,
        reason: banReason,
        banned_by: currentAdmin?.username || 'admin'
      })
      
      console.log('✅ Ban result:', result)
      
      if (result.success === false && result.existing_ban) {
        // User already banned
        setAlreadyBannedUser(result as BanResponse)
        toast.error('This user is already banned')
      } else if (result.success === true) {
        // Successfully banned
        toast.success(`User ${userId} banned successfully`)
        setUserId('')
        setUserName('')
        setBanReason('')
        setBanType('ALL')
        fetchBanStats()
        fetchBannedUsers()
      }
    } catch (error: any) {
      console.error('❌ Error banning user:', error)
      toast.error(`Failed to ban user: ${error.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUnbanUser = async () => {
    if (!unbanModal) return

    try {
      const { apiService } = await import('@/lib/api')
      const result = await apiService.unbanUser(unbanModal.user_id)
      
      if (result.success) {
        toast.success(`User ${unbanModal.user_id} unbanned successfully`)
        setUnbanModal(null)
        fetchBanStats()
        fetchBannedUsers()
      } else {
        toast.error('Failed to unban user')
      }
    } catch (error) {
      console.error('Error unbanning user:', error)
      toast.error('Failed to unban user')
    }
  }

  const handleRemoveAllData = async () => {
    if (!removeDataModal || !removeReason) return
    
    try {
      const response = await fetch(`/api/remove-user-data/${removeDataModal}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remove_reason: removeReason,
          removed_by: 'admin'
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success(`Removed ${result.total_removed} items for user ${removeDataModal}`)
        setRemoveDataModal(null)
        setRemoveReason('')
        setAlreadyBannedUser(null)
        fetchBanStats()
        fetchBannedUsers()
      } else {
        toast.error('Failed to remove user data')
      }
    } catch (error) {
      console.error('Error removing user data:', error)
      toast.error('Failed to remove user data')
    }
  }

  const getBanTypeColor = (type: string) => {
    switch (type) {
      case 'REACTION': return 'badge-warning'
      case 'COMMENT': return 'badge-primary'
      case 'ALL': return 'badge-danger'
      default: return 'badge-gray'
    }
  }

  const getBanTypeIcon = (type: string) => {
    switch (type) {
      case 'REACTION': return <Activity className="w-4 h-4" />
      case 'COMMENT': return <User className="w-4 h-4" />
      case 'ALL': return <Ban className="w-4 h-4" />
      default: return <Shield className="w-4 h-4" />
    }
  }

  const filteredBannedUsers = bannedUsers.filter(user => {
    const matchesSearch = user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.reason.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">Ban Management</h1>
                  <p className="text-sm text-gray-600">Manage user bans and restrictions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
        >
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Banned</p>
                <p className="stat-number">{stats?.totalBanned || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Ban className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Reaction Bans</p>
                <p className="stat-number">{stats?.reactionBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Comment Bans</p>
                <p className="stat-number">{stats?.commentBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">All Bans</p>
                <p className="stat-number">{stats?.allBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Recent (7d)</p>
                <p className="stat-number">{stats?.recentBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ban User Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-8"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <Ban className="w-5 h-5 text-red-600" />
            <span>Ban User</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">User ID *</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID..."
                className="input"
                required
              />
            </div>
            
            <div>
              <label className="label">User Name (Optional)</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter user name..."
                className="input"
              />
            </div>
            
            <div>
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
            
            <div>
              <label className="label">Ban Reason *</label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="input"
                rows={3}
                placeholder="Enter ban reason..."
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleBanUser}
              disabled={loading || !userId || !banReason}
              className="btn-danger disabled:opacity-50 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4"></div>
                  <span>Banning...</span>
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" />
                  <span>Ban User</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Banned Users List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-600" />
                <span>Banned Users ({filteredBannedUsers.length})</span>
              </h2>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search banned users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredBannedUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Ban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banned users found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredBannedUsers.map((user, index) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Ban className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.user_name || user.user_id}
                          </h3>
                          <span className={`badge ${getBanTypeColor(user.ban_type)} flex items-center space-x-1`}>
                            {getBanTypeIcon(user.ban_type)}
                            <span>{user.ban_type}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">ID: {user.user_id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">Banned by: {user.banned_by}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Banned: {new Date(user.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-red-800">
                            <strong>Reason:</strong> {user.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setUnbanModal(user)}
                        className="btn-success flex items-center space-x-1"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Unban</span>
                      </button>
                      <button
                        onClick={() => setRemoveDataModal(user.user_id)}
                        className="btn-danger flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove Data</span>
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
                  onClick={() => setAlreadyBannedUser(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {alreadyBannedUser.can_remove_data && (
                  <button
                    onClick={() => {
                      setRemoveDataModal(userId)
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

      {/* Unban User Modal */}
      {unbanModal && (
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
                <UserCheck className="w-6 h-6 text-green-600" />
                <span>Unban User</span>
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">User ID: {unbanModal.user_id}</p>
                <p className="text-sm text-gray-600 mb-2">User Name: {unbanModal.user_name || 'N/A'}</p>
                <p className="text-sm text-gray-600 mb-2">Ban Type: <span className="font-medium">{unbanModal.ban_type}</span></p>
                <p className="text-sm text-gray-600 mb-2">Ban Reason: {unbanModal.reason}</p>
                <p className="text-sm text-gray-600">Banned At: {new Date(unbanModal.createdAt).toLocaleString()}</p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Are you sure you want to unban this user?</strong>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  This will restore their ability to perform the banned activities.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setUnbanModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnbanUser}
                  className="btn-success flex items-center space-x-1"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Unban User</span>
                </button>
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
