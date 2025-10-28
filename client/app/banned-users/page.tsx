'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserX, 
  Users, 
  Ban,
  UserCheck,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  Shield
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import toast from 'react-hot-toast'

interface BannedUser {
  _id: string
  user_id: string
  user_name: string
  ban_type: 'REACTION' | 'COMMENT' | 'ALL'
  reason: string
  banned_by: string
  banned_at: string
  createdAt: string
  updatedAt: string
}

interface BanStats {
  totalBanned: number
  reactionBans: number
  commentBans: number
  allBans: number
  recentBans: number
}

export default function BannedUsersManagement() {
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([])
  const [stats, setStats] = useState<BanStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [unbanModal, setUnbanModal] = useState<BannedUser | null>(null)
  const { socket } = useSocket()

  useEffect(() => {
    fetchBannedUsers()
    fetchStats()
    
    if (socket) {
      socket.on('user_banned', (bannedUser) => {
        setBannedUsers(prev => [bannedUser, ...prev])
        toast.success('New user banned!')
        fetchStats()
      })
      
      socket.on('user_unbanned', (unbannedUser) => {
        setBannedUsers(prev => prev.filter(user => user.user_id !== unbannedUser.user_id))
        toast.success('User unbanned successfully!')
        fetchStats()
      })
    }

    return () => {
      if (socket) {
        socket.off('user_banned')
        socket.off('user_unbanned')
      }
    }
  }, [socket, page, filterType])

  const fetchBannedUsers = async () => {
    try {
      const response = await apiService.getBannedUsers(page, 50, filterType)
      if (response.success && response.data) {
        setBannedUsers(response.data as BannedUser[])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching banned users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getBanStats()
      if (response.success && response.stats) {
        setStats(response.stats as BanStats)
      }
    } catch (error) {
      console.error('Error fetching ban stats:', error)
    }
  }

  const handleUnbanUser = async () => {
    if (!unbanModal) return
    
    try {
      await apiService.unbanUser(unbanModal.user_id)
      toast.success(`User ${unbanModal.user_name} unbanned successfully!`)
      setUnbanModal(null)
      fetchBannedUsers()
      fetchStats()
    } catch (error) {
      console.error('Error unbanning user:', error)
    }
  }

  const getBanTypeColor = (banType: string) => {
    switch (banType) {
      case 'REACTION': return 'badge-warning'
      case 'COMMENT': return 'badge-danger'
      case 'ALL': return 'badge-danger'
      default: return 'badge-gray'
    }
  }

  const getBanTypeIcon = (banType: string) => {
    switch (banType) {
      case 'REACTION': return <AlertTriangle className="w-4 h-4" />
      case 'COMMENT': return <UserX className="w-4 h-4" />
      case 'ALL': return <Shield className="w-4 h-4" />
      default: return <Ban className="w-4 h-4" />
    }
  }

  const filteredUsers = bannedUsers.filter(user => {
    const matchesSearch = user.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.reason.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || user.ban_type === filterType
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
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
                  <UserX className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text">Banned Users</h1>
                  <p className="text-sm text-gray-600">Manage banned users and unban them</p>
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
                <UserX className="w-6 h-6 text-white" />
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
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Comment Bans</p>
                <p className="stat-number">{stats?.commentBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Ban className="w-6 h-6 text-white" />
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
                <p className="stat-label">Recent Bans</p>
                <p className="stat-number">{stats?.recentBans || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user name, ID, or reason..."
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
                <option value="ALL">All Bans</option>
                <option value="REACTION">Reaction Bans</option>
                <option value="COMMENT">Comment Bans</option>
                <option value="ALL">All Activity Bans</option>
              </select>
            </div>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Banned Users ({filteredUsers.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banned users found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredUsers.map((user, index) => (
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
                        <UserX className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {user.user_name || 'Unknown User'}
                          </h3>
                          <span className={`badge ${getBanTypeColor(user.ban_type)} flex items-center space-x-1`}>
                            {getBanTypeIcon(user.ban_type)}
                            <span>{user.ban_type}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">User ID: {user.user_id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Banned by: {user.banned_by}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Ban Type: {user.ban_type}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                Banned: {new Date(user.banned_at || user.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">
                                Updated: {new Date(user.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                          <p className="text-sm text-red-800">
                            <strong>Ban Reason:</strong> {user.reason}
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

      {/* Unban Confirmation Modal */}
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
              <h2 className="text-xl font-semibold text-green-600">Unban User</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Are you sure you want to unban this user?</p>
                <p className="text-sm text-gray-600 mb-2">User: {unbanModal.user_name}</p>
                <p className="text-sm text-gray-600 mb-2">User ID: {unbanModal.user_id}</p>
                <p className="text-sm text-gray-600 mb-2">Ban Type: {unbanModal.ban_type}</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-700">
                    <strong>Ban Reason:</strong> {unbanModal.reason}
                  </p>
                </div>
                <p className="text-sm text-green-600 font-medium">This will restore all user permissions!</p>
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
                  className="btn-success"
                >
                  Yes, Unban User
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
