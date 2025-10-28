'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Users, 
  Reply,
  Ban,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  Clock,
  User,
  Shield,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import toast from 'react-hot-toast'

interface Comment {
  _id: string
  name: string
  user_id: string
  comment: string
  comment_id: string
  post_id: string
  post_link?: string
  action_type: string
  parent_comment_id?: string
  reply_to?: string
  custom_action?: string
  createdAt: string
}

interface CommentStats {
  totalComments: number
  totalReplies: number
  topUsers: Array<{ _id: string; count: number; name: string }>
  topPosts: Array<{ _id: string; count: number; post_link: string }>
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

export default function CommentManagement() {
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState<CommentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [replyModal, setReplyModal] = useState<Comment | null>(null)
  const [banModal, setBanModal] = useState<{ user_id: string; user_name: string } | null>(null)
  const [deleteModal, setDeleteModal] = useState<Comment | null>(null)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')
  const [deleteOption, setDeleteOption] = useState<'database' | 'facebook' | 'both'>('database')
  const [replyAndDelete, setReplyAndDelete] = useState(false)
  
  // Ban management states
  const [banType, setBanType] = useState<'REACTION' | 'COMMENT' | 'ALL'>('COMMENT')
  const [banReason, setBanReason] = useState('')
  const [removeAllData, setRemoveAllData] = useState(true) // Default checked
  const [alreadyBannedUser, setAlreadyBannedUser] = useState<BanResponse | null>(null)
  const [removeDataModal, setRemoveDataModal] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const { socket } = useSocket()

  useEffect(() => {
    fetchComments()
    fetchStats()
    
    if (socket) {
      socket.on('new_comment', (comment) => {
        setComments(prev => [comment, ...prev])
        toast.success('New comment received!')
        fetchStats()
      })
      
      socket.on('new_reply', (reply) => {
        setComments(prev => [reply, ...prev])
        toast.success('New reply received!')
        fetchStats()
      })
    }

    return () => {
      if (socket) {
        socket.off('new_comment')
        socket.off('new_reply')
      }
    }
  }, [socket, page])

  const fetchComments = async () => {
    try {
      const response = await apiService.getComments(page, 50)
      if (response.success) {
        setComments(response.data as Comment[])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiService.getCommentStats()
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching comment stats:', error)
    }
  }

  const handleReply = async () => {
    if (!replyModal || !replyText.trim()) return
    
    try {
      await apiService.replyToComment({
        parent_comment_id: replyModal.comment_id,
        reply_text: replyText,
        user_id: 'admin',
        user_name: 'Admin',
        post_id: replyModal.post_id,
        delete_after_reply: replyAndDelete
      })
      toast.success('Reply posted successfully!')
      setReplyModal(null)
      setReplyText('')
      setReplyAndDelete(false)
      fetchComments()
      fetchStats()
    } catch (error) {
      console.error('Error posting reply:', error)
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
        setBanType('COMMENT')
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
      fetchComments()
      fetchStats()
    } catch (error: any) {
      console.error('Error removing user data:', error)
      toast.error('Failed to remove user data: ' + (error.message || 'Unknown error'))
    }
  }

  const handleDeleteComment = async () => {
    if (!deleteConfirmModal) return
    
    try {
      await apiService.deleteComment(deleteConfirmModal.comment_id, deleteOption)
      toast.success('Comment deleted successfully!')
      setDeleteConfirmModal(null)
      setDeleteOption('database')
      fetchComments()
      fetchStats()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const openDeleteModal = (comment: Comment) => {
    setDeleteModal(comment)
  }

  const confirmDelete = () => {
    if (deleteModal) {
      setDeleteConfirmModal(deleteModal)
      setDeleteModal(null)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ADDED': return 'badge-success'
      case 'REPLY': return 'badge-primary'
      case 'EDITED': return 'badge-warning'
      case 'DELETED': return 'badge-danger'
      default: return 'badge-gray'
    }
  }

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.comment.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'ALL' || 
                         (filterType === 'COMMENTS' && !comment.parent_comment_id) ||
                         (filterType === 'REPLIES' && comment.parent_comment_id)
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">Comment Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Monitor and manage user comments</p>
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
                <p className="stat-label">Total Comments</p>
                <p className="stat-number">{stats?.totalComments || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Replies</p>
                <p className="stat-number">{stats?.totalReplies || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Reply className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Top Commenter</p>
                <p className="stat-number text-base sm:text-lg">
                  {stats?.topUsers?.[0]?.name?.substring(0, 8) || 'N/A'}
                </p>
                <p className="stat-change-positive">
                  {stats?.topUsers?.[0]?.count || 0} comments
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Posts</p>
                <p className="stat-number">{stats?.topPosts?.length || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user, comment content, or ID..."
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
                <option value="ALL">All Comments</option>
                <option value="COMMENTS">Comments Only</option>
                <option value="REPLIES">Replies Only</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Comments List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="mobile-heading font-semibold text-gray-900">
              Recent Comments ({filteredComments.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredComments.length === 0 ? (
              <div className="p-6 sm:p-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No comments found</h3>
                <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredComments.map((comment, index) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {comment.name || 'Unknown User'}
                          </h3>
                          <span className={`badge ${getActionColor(comment.action_type)} text-xs`}>
                            {comment.action_type}
                          </span>
                          {comment.parent_comment_id && (
                            <span className="badge-primary text-xs">Reply</span>
                          )}
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm sm:text-base text-gray-900 whitespace-pre-wrap break-words">
                            {comment.comment}
                          </p>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <p className="truncate">User ID: {comment.user_id}</p>
                          <p className="truncate">Comment ID: {comment.comment_id}</p>
                          <p className="truncate">Post ID: {comment.post_id}</p>
                          {comment.post_link && (
                            <p className="truncate">
                              Post: {comment.post_link}
                            </p>
                          )}
                          {comment.reply_to && (
                            <p className="truncate">Replying to: {comment.reply_to}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs">{new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setReplyModal(comment)}
                        className="btn-primary flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                      >
                        <Reply className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Reply</span>
                      </button>
                      <button
                        onClick={() => openDeleteModal(comment)}
                        className="btn-danger flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={() => handleBanUser(comment.user_id, comment.name || 'Unknown')}
                        className="btn-warning flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                      >
                        <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Ban</span>
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

      {/* Reply Modal */}
      {replyModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-2xl w-full"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Reply to Comment</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900 mb-2">Original Comment:</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-900">{replyModal.comment}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    by {replyModal.name || 'Unknown User'} • {new Date(replyModal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="label">Your Reply:</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input"
                  rows={4}
                  placeholder="Type your reply here..."
                />
              </div>
              
              <div className="mb-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="replyAndDelete"
                      checked={replyAndDelete}
                      onChange={(e) => setReplyAndDelete(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="replyAndDelete" className="text-sm text-gray-700">
                      Delete this comment from database after replying
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setReplyModal(null)
                    setReplyText('')
                    setReplyAndDelete(false)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {replyAndDelete ? 'Reply & Delete' : 'Post Reply'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

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
                    setBanType('COMMENT')
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

      {/* Delete Comment Modal */}
      {deleteModal && (
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
              <h2 className="text-xl font-semibold text-gray-900">Delete Comment</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Comment by: {deleteModal.name || 'Unknown User'}</p>
                <p className="text-sm text-gray-600 mb-2">Comment ID: {deleteModal.comment_id}</p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-700">{deleteModal.comment}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="label">Delete Option:</label>
                <select
                  value={deleteOption}
                  onChange={(e) => setDeleteOption(e.target.value as 'database' | 'facebook' | 'both')}
                  className="input"
                >
                  <option value="database">Delete from Database only</option>
                  <option value="facebook">Delete from Facebook only</option>
                  <option value="both">Delete from both Database and Facebook</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-danger"
                >
                  Delete Comment
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal && (
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
              <h2 className="text-xl font-semibold text-red-600">Confirm Deletion</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Are you sure you want to delete this comment?</p>
                <p className="text-sm text-gray-600 mb-2">Comment by: {deleteConfirmModal.name || 'Unknown User'}</p>
                <p className="text-sm text-gray-600 mb-2">Delete from: {deleteOption === 'database' ? 'Database' : deleteOption === 'facebook' ? 'Facebook' : 'Both Database and Facebook'}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">{deleteConfirmModal.comment}</p>
                </div>
                <p className="text-sm text-red-600 font-medium">This action cannot be undone!</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setDeleteConfirmModal(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteComment}
                  className="btn-danger"
                >
                  Yes, Delete Comment
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
