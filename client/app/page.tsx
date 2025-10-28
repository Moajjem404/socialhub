'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  MessageSquare, 
  Package, 
  Settings, 
  Users, 
  Trash2,
  Zap,
  TrendingUp,
  Activity,
  Globe
} from 'lucide-react'
import { useSocket } from '@/contexts/SocketContext'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalReactions: number
  totalComments: number
  totalOrders: number
  pendingOrders: number
  webhookCount: number
  bannedUsersCount: number
  recentReactions: any[]
  recentComments: any[]
  recentOrders: any[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    fetchDashboardStats()
    
    if (socket) {
      socket.on('new_reaction', () => {
        fetchDashboardStats()
        toast.success('New reaction received!')
      })
      
      socket.on('new_comment', () => {
        fetchDashboardStats()
        toast.success('New comment received!')
      })
      
      socket.on('new_order', () => {
        fetchDashboardStats()
        toast.success('New order received!')
      })
      
      socket.on('order_updated', () => {
        fetchDashboardStats()
        toast.success('Order status updated!')
      })
    }

    return () => {
      if (socket) {
        socket.off('new_reaction')
        socket.off('new_comment')
        socket.off('new_order')
        socket.off('order_updated')
      }
    }
  }, [socket])

  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getDashboardStats()
      if (response.success) {
        setStats(response.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupOldData = async () => {
    if (confirm('Are you sure you want to delete all data older than 7 days?')) {
      try {
        const response = await apiService.cleanupOldData()
        if (response.success) {
          const data = response.data as { deleted_reactions: number; deleted_comments: number }
          toast.success(`Cleaned up ${data.deleted_reactions} reactions and ${data.deleted_comments} comments`)
          fetchDashboardStats()
        }
      } catch (error) {
        console.error('Error cleaning up data:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Reactions',
      value: stats?.totalReactions || 0,
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Comments',
      value: stats?.totalComments || 0,
      icon: MessageSquare,
      color: 'from-green-500 to-green-600',
      change: '+8%',
      changeType: 'positive' as const
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'from-purple-500 to-purple-600',
      change: '+15%',
      changeType: 'positive' as const
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      change: '-3%',
      changeType: 'negative' as const
    },
    {
      title: 'Active Webhooks',
      value: stats?.webhookCount || 0,
      icon: Zap,
      color: 'from-pink-500 to-pink-600',
      change: '+2',
      changeType: 'positive' as const
    },
    {
      title: 'Banned Users',
      value: stats?.bannedUsersCount || 0,
      icon: Users,
      color: 'from-red-500 to-red-600',
      change: '0',
      changeType: 'neutral' as const
    }
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">SocialHub Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage your social media interactions</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs sm:text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleCleanupOldData}
                className="btn-danger flex items-center space-x-1 sm:space-x-2"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Clean Old Data</span>
                <span className="sm:hidden">Clean</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="page-content">
        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="responsive-grid mb-6 sm:mb-8"
        >
          {statCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              className="stat-card group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="stat-label">{card.title}</p>
                  <p className="stat-number">{card.value.toLocaleString()}</p>
                  <p className={`stat-change-${card.changeType}`}>
                    {card.change}
                  </p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-hover p-4 sm:p-6 cursor-pointer"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Reactions</h3>
                <p className="text-xs sm:text-sm text-gray-600">Manage reactions</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-hover p-6 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Comments</h3>
                <p className="text-sm text-gray-600">Manage comments</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-hover p-6 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Orders</h3>
                <p className="text-sm text-gray-600">Manage orders</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card-hover p-6 cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Webhooks</h3>
                <p className="text-sm text-gray-600">Manage webhooks</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {/* Recent Reactions */}
          <div className="card p-4 sm:p-6">
            <h3 className="mobile-heading font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              Recent Reactions
            </h3>
            <div className="space-y-3">
              {stats?.recentReactions?.slice(0, 5).map((reaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">
                        {reaction.reaction_type?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {reaction.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reaction.reaction_type} • {new Date(reaction.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className="badge-primary">
                    {reaction.action_type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Comments */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
              Recent Comments
            </h3>
            <div className="space-y-3">
              {stats?.recentComments?.slice(0, 5).map((comment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-green-600">
                        {comment.name?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {comment.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {comment.comment?.substring(0, 30)}...
                      </p>
                    </div>
                  </div>
                  <span className="badge-success">
                    {comment.action_type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Recent Orders
            </h3>
            <div className="space-y-3">
              {stats?.recentOrders?.slice(0, 5).map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">
                        {order.name?.charAt(0) || 'O'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.name || 'Unknown Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.product_name} • ${order.total_price}
                      </p>
                    </div>
                  </div>
                  <span className={`badge-${order.status === 'PENDING' ? 'warning' : order.status === 'CONFIRMED' ? 'success' : order.status === 'DELIVERED' ? 'primary' : 'danger'}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
