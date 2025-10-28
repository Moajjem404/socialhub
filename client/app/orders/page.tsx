'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  Truck,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  User,
  MapPin,
  Phone,
  Ban,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  order_id: string
  name: string
  number: string
  address: string
  product_name: string
  total_product: number
  total_price: number
  text?: string
  sender_id: string
  recipient_id: string
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'
  cancel_reason?: string
  cancel_message?: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  deliveredOrders: number
  cancelledOrders: number
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

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('PENDING')
  const [updateModal, setUpdateModal] = useState<Order | null>(null)
  const [cancelModal, setCancelModal] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  
  // Ban management states
  const [banModal, setBanModal] = useState<Order | null>(null)
  const [banType, setBanType] = useState<'REACTION' | 'COMMENT' | 'ALL'>('ALL')
  const [banReason, setBanReason] = useState('')
  const [removeAllData, setRemoveAllData] = useState(true) // Default checked
  const [alreadyBannedUser, setAlreadyBannedUser] = useState<BanResponse | null>(null)
  const [removeDataModal, setRemoveDataModal] = useState<string | null>(null)
  const [removeReason, setRemoveReason] = useState('')
  const { socket } = useSocket()

  useEffect(() => {
    fetchOrders()
    fetchStats()
    
    if (socket) {
      socket.on('new_order', (order: Order) => {
        setOrders(prev => [order, ...prev])
        toast.success('New order received!')
        fetchStats()
      })
      
      socket.on('order_updated', (order: Order) => {
        setOrders(prev => prev.map(o => o._id === order._id ? order : o))
        toast.success('Order status updated!')
        fetchStats()
      })
    }

    return () => {
      if (socket) {
        socket.off('new_order')
        socket.off('order_updated')
      }
    }
  }, [socket, page, filterStatus])

  const fetchOrders = async (retryCount = 0) => {
    try {
      const response = await apiService.getOrders(page, 50, filterStatus)
      if (response.success && response.data) {
        setOrders(response.data as Order[])
        setTotalPages(response.pagination?.pages || 1)
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error)
      
      // Retry for 429 errors (rate limiting)
      if (error.message?.includes('Too many requests') && retryCount < 3) {
        console.log(`Retrying fetchOrders (attempt ${retryCount + 1})...`)
        setTimeout(() => {
          fetchOrders(retryCount + 1)
        }, 2000 * (retryCount + 1)) // Exponential backoff
      } else {
        toast.error('Failed to fetch orders. Please try again.')
      }
    } finally {
      if (retryCount === 0) {
        setLoading(false)
      }
    }
  }

  const fetchStats = async (retryCount = 0) => {
    try {
      const response = await apiService.getOrderStats()
      if (response.success && response.stats) {
        setStats(response.stats as OrderStats)
      }
    } catch (error: any) {
      console.error('Error fetching order stats:', error)
      
      // Retry for 429 errors (rate limiting)
      if (error.message?.includes('Too many requests') && retryCount < 2) {
        console.log(`Retrying fetchStats (attempt ${retryCount + 1})...`)
        setTimeout(() => {
          fetchStats(retryCount + 1)
        }, 1000 * (retryCount + 1)) // Shorter backoff for stats
      }
    }
  }

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    try {
      await apiService.updateOrderStatus(order.order_id, newStatus)
      toast.success(`Order ${order.order_id} status updated to ${newStatus}`)
      setUpdateModal(null)
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const handleCancelOrder = async () => {
    if (!cancelModal || !cancelReason) return
    
    try {
      await apiService.updateOrderStatus(
        cancelModal.order_id, 
        'CANCELLED', 
        cancelReason, 
        customMessage
      )
      toast.success(`Order ${cancelModal.order_id} cancelled successfully`)
      setCancelModal(null)
      setCancelReason('')
      setCustomMessage('')
    } catch (error) {
      console.error('Error cancelling order:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-warning'
      case 'CONFIRMED': return 'badge-primary'
      case 'DELIVERED': return 'badge-success'
      case 'CANCELLED': return 'badge-danger'
      default: return 'badge-gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />
      case 'CONFIRMED': return <CheckCircle className="w-4 h-4" />
      case 'DELIVERED': return <Truck className="w-4 h-4" />
      case 'CANCELLED': return <XCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const handleBanUser = async () => {
    if (!banModal || !banReason) return
    
    try {
      console.log('🚫 Banning user:', {
        user_id: banModal.sender_id,
        user_name: banModal.name,
        ban_type: banType,
        reason: banReason
      })
      
      const result = await apiService.banUser({
        user_id: banModal.sender_id,
        user_name: banModal.name,
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
        toast.success(`User ${banModal.name} banned successfully`)
        
        // If remove all data is checked, remove all data
        if (removeAllData) {
          try {
            console.log('🗑️ Removing all data for user:', banModal.sender_id)
            const removeResponse = await apiService.removeUserData(
              banModal.sender_id,
              `Data removed during ban: ${banReason}`,
              'admin'
            )
            
            if (removeResponse.success) {
              console.log('✅ Data removal result:', removeResponse)
              toast.success(`Also removed ${(removeResponse as any).total_removed || 'all'} items for user ${banModal.name}`)
            } else {
              console.error('❌ Data removal error:', removeResponse)
              toast.error(`Failed to remove user data: ${removeResponse.message || 'Unknown error'}`)
            }
          } catch (error: any) {
            console.error('❌ Error removing user data:', error)
            toast.error('Failed to remove user data')
          }
        }
        
        setBanModal(null)
        setBanReason('')
        setBanType('ALL')
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
      } else {
        toast.error('Failed to remove user data')
      }
    } catch (error) {
      console.error('Error removing user data:', error)
      toast.error('Failed to remove user data')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.number.includes(searchTerm)
    return matchesSearch
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">Order Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage customer orders and track status</p>
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
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
        >
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Orders</p>
                <p className="stat-number">{stats?.totalOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Pending</p>
                <p className="stat-number">{stats?.pendingOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Confirmed</p>
                <p className="stat-number">{stats?.confirmedOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Delivered</p>
                <p className="stat-number">{stats?.deliveredOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Cancelled</p>
                <p className="stat-number">{stats?.cancelledOrders || 0}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
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
                  placeholder="Search by customer name, order ID, or product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="PENDING">Pending Orders</option>
                <option value="CONFIRMED">Confirmed Orders</option>
                <option value="DELIVERED">Delivered Orders</option>
                <option value="CANCELLED">Cancelled Orders</option>
                <option value="ALL">All Orders</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="mobile-heading font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredOrders.length === 0 ? (
              <div className="p-6 sm:p-12 text-center">
                <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredOrders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 sm:p-4 lg:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {order.name}
                          </h3>
                          <span className={`badge ${getStatusColor(order.status)} flex items-center space-x-1 text-xs`}>
                            {getStatusIcon(order.status)}
                            <span>{order.status}</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 mb-3 lg:mb-4">
                          <div className="space-y-1.5 lg:space-y-2">
                            <div className="flex items-center space-x-2">
                              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600 truncate">Order ID: {order.order_id}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600 truncate">Product: {order.product_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs sm:text-sm text-gray-600">Quantity: {order.total_product}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5 lg:space-y-2">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600">{order.number}</span>
                            </div>
                            <div className="flex items-start space-x-2">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mt-0.5" />
                              <span className="text-xs sm:text-sm text-gray-600 truncate lg:max-w-xs">{order.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm font-medium text-gray-900">${order.total_price}</span>
                            </div>
                          </div>
                        </div>
                        
                        {order.text && (
                          <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-2 lg:mb-3">
                            <p className="text-xs sm:text-sm text-gray-700">{order.text}</p>
                          </div>
                        )}
                        
                        {order.cancel_reason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-2 lg:mb-3">
                            <p className="text-xs sm:text-sm text-red-800">
                              <strong>Cancellation Reason:</strong> {order.cancel_reason}
                            </p>
                            {order.cancel_message && (
                              <p className="text-xs sm:text-sm text-red-700 mt-1">{order.cancel_message}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 gap-1 text-xs text-gray-500">
                          <span>Created: {new Date(order.createdAt).toLocaleString()}</span>
                          <span>Updated: {new Date(order.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 lg:ml-4">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order, 'CONFIRMED')}
                            className="btn-success flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => setCancelModal(order)}
                            className="btn-danger flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => setBanModal(order)}
                            className="btn-warning flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Ban User</span>
                            <span className="sm:hidden">Ban</span>
                          </button>
                        </>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order, 'DELIVERED')}
                            className="btn-success flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Delivered</span>
                          </button>
                          <button
                            onClick={() => setCancelModal(order)}
                            className="btn-danger flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Cancel</span>
                          </button>
                          <button
                            onClick={() => setBanModal(order)}
                            className="btn-warning flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Ban User</span>
                            <span className="sm:hidden">Ban</span>
                          </button>
                        </>
                      )}
                      {order.status === 'DELIVERED' && (
                        <>
                          <span className="text-xs sm:text-sm text-green-600 font-medium">
                            Order Completed
                          </span>
                          <button
                            onClick={() => setBanModal(order)}
                            className="btn-warning flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Ban User</span>
                            <span className="sm:hidden">Ban</span>
                          </button>
                        </>
                      )}
                      {order.status === 'CANCELLED' && (
                        <>
                          <span className="text-xs sm:text-sm text-red-600 font-medium">
                            Order Cancelled
                          </span>
                          <button
                            onClick={() => setBanModal(order)}
                            className="btn-warning flex items-center space-x-1 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          >
                            <Ban className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Ban User</span>
                            <span className="sm:hidden">Ban</span>
                          </button>
                        </>
                      )}
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

      {/* Cancel Order Modal */}
      {cancelModal && (
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
              <h2 className="text-xl font-semibold text-gray-900">
                Cancel Order {cancelModal.status === 'CONFIRMED' ? '(Confirmed Order)' : '(Pending Order)'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {cancelModal.status === 'CONFIRMED' 
                  ? 'This order has been confirmed. Are you sure you want to cancel it?' 
                  : 'Cancel this pending order.'
                }
              </p>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Order ID: {cancelModal.order_id}</p>
                <p className="text-sm text-gray-600">Customer: {cancelModal.name}</p>
                <p className="text-sm text-gray-600">Product: {cancelModal.product_name}</p>
                <p className="text-sm text-gray-600">Current Status: <span className={`font-medium ${cancelModal.status === 'CONFIRMED' ? 'text-blue-600' : 'text-yellow-600'}`}>{cancelModal.status}</span></p>
              </div>
              
              <div className="mb-4">
                <label className="label">Cancellation Reason</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="Customer Request">Customer Request</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Payment Failed">Payment Failed</option>
                  <option value="Invalid Address">Invalid Address</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {cancelReason === 'Other' && (
                <div className="mb-4">
                  <label className="label">Custom Message</label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Enter custom cancellation message..."
                    required
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCancelModal(null)
                    setCancelReason('')
                    setCustomMessage('')
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancelOrder}
                  disabled={!cancelReason || (cancelReason === 'Other' && !customMessage.trim())}
                  className="btn-danger disabled:opacity-50"
                >
                  {cancelModal.status === 'CONFIRMED' ? 'Cancel Confirmed Order' : 'Cancel Order'}
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
                Ban user: {banModal.name} (ID: {banModal.sender_id})
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
                    setBanType('ALL')
                    setRemoveAllData(true)
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
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
                      setRemoveDataModal(banModal?.sender_id || '')
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
