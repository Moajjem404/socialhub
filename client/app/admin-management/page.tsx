'use client'



import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Key
} from 'lucide-react'
import { apiService } from '@/lib/api'
import toast from 'react-hot-toast'

interface Admin {
  _id: string
  username: string
  role: string
  isActive: boolean
  createdBy: string
  lastLogin: string
  createdAt: string
}

interface AdminActivity {
  _id: string
  adminUsername: string
  action: string
  details: any
  ipAddress: string
  createdAt: string
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<string>('')
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: ''
  })

  useEffect(() => {
    fetchAdmins()
    fetchActivities()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await apiService.getAdmins()
      if (response.success) {
        setAdmins(response.data as Admin[])
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await apiService.getAdminActivities(1, 20)
      if (response.success) {
        setActivities(response.data as AdminActivity[])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newAdmin.username || !newAdmin.password) {
      toast.error('Username and password are required')
      return
    }

    try {
      const response = await apiService.createAdmin(newAdmin)
      if (response.success) {
        toast.success('Admin created successfully')
        setShowAddModal(false)
        setNewAdmin({ username: '', password: '' })
        fetchAdmins()
        fetchActivities()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create admin')
    }
  }

  const handleDeleteAdmin = async (username: string) => {
    if (!confirm(`Are you sure you want to delete admin "${username}"?`)) {
      return
    }

    try {
      const response = await apiService.deleteAdmin(username)
      if (response.success) {
        toast.success('Admin deleted successfully')
        fetchAdmins()
        fetchActivities()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete admin')
    }
  }

  const handleToggleStatus = async (username: string) => {
    try {
      const response = await apiService.toggleAdminStatus(username)
      if (response.success) {
        const data = response.data as { isActive: boolean }
        toast.success(`Admin ${data.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchAdmins()
        fetchActivities()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle admin status')
    }
  }

  const viewAdminActivities = async (username: string) => {
    setSelectedAdmin(username)
    try {
      const response = await apiService.getUserActivities(username)
      if (response.success) {
        setActivities(response.data as AdminActivity[])
        setShowActivityModal(true)
      }
    } catch (error: any) {
      toast.error('Failed to fetch admin activities')
    }
  }

  const getActionColor = (action: string) => {
    if (!action) return 'text-gray-600 bg-gray-50'
    if (action.includes('LOGIN_SUCCESS')) return 'text-green-600 bg-green-50'
    if (action.includes('LOGIN_FAILED')) return 'text-red-600 bg-red-50'
    if (action.includes('CREATED')) return 'text-blue-600 bg-blue-50'
    if (action.includes('DELETED')) return 'text-red-600 bg-red-50'
    if (action.includes('LOGOUT')) return 'text-gray-600 bg-gray-50'
    return 'text-purple-600 bg-purple-50'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-0">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">Admin Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600">Manage administrators</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Admin</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Admins</p>
                <p className="stat-number">{admins.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Admins</p>
                <p className="stat-number">{admins.filter(a => a.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Recent Activities</p>
                <p className="stat-number">{activities.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          {/* Admins List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <span>Administrators ({admins.length})</span>
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {admins.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No admins found</h3>
                  <p className="text-sm sm:text-base text-gray-600">Add your first admin to get started</p>
                </div>
              ) : (
                admins.map((admin, index) => (
                  <motion.div
                    key={admin._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {admin.username}
                            </h3>
                            <span className={`badge text-xs ${admin.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {admin.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600">Created by: {admin.createdBy || 'System'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                              <span className="text-xs sm:text-sm text-gray-600">
                                Created: {new Date(admin.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {admin.lastLogin && (
                              <div className="flex items-center space-x-2">
                                <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                                <span className="text-xs sm:text-sm text-gray-600">
                                  Last login: {new Date(admin.lastLogin).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewAdminActivities(admin.username)}
                          className="btn-secondary flex items-center justify-center flex-1 sm:flex-initial space-x-1 text-sm"
                          title="View Activities"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="sm:hidden">View</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin.username)}
                          className={`btn-${admin.isActive ? 'warning' : 'success'} flex items-center justify-center flex-1 sm:flex-initial text-sm`}
                          title={admin.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {admin.isActive ? <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin.username)}
                          className="btn-danger flex items-center justify-center flex-1 sm:flex-initial text-sm"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Activities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <span>Recent Activities</span>
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No activities yet</h3>
                  <p className="text-sm sm:text-base text-gray-600">Admin activities will appear here</p>
                </div>
              ) : (
                activities.map((activity, index) => (
                  <motion.div
                    key={activity._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 sm:p-4 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                      <div className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${getActionColor(activity.action)}`}>
                        {activity.action ? activity.action.replace(/_/g, ' ') : 'Unknown Action'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-900">{activity.adminUsername}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <p className="text-xs text-gray-600 mt-1 break-all">
                            {JSON.stringify(activity.details)}
                          </p>
                        )}
                        {activity.ipAddress && (
                          <p className="text-xs text-gray-500">IP: {activity.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Add Admin Modal */}
      {showAddModal && (
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
                <UserPlus className="w-6 h-6 text-blue-600" />
                <span>Add New Admin</span>
              </h2>
            </div>
            
            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  className="input"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="input"
                  placeholder="Enter password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use a strong password with at least 8 characters
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setNewAdmin({ username: '', password: '' })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center space-x-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Admin</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Activity className="w-6 h-6 text-purple-600" />
                <span>Activities for {selectedAdmin}</span>
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getActionColor(activity.action)}`}>
                        {activity.action ? activity.action.replace(/_/g, ' ') : 'Unknown Action'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {activity.details && Object.keys(activity.details).length > 0 && (
                      <pre className="text-xs bg-white p-2 rounded border border-gray-200 mt-2 overflow-x-auto">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    )}
                    {activity.ipAddress && (
                      <p className="text-xs text-gray-500 mt-1">IP: {activity.ipAddress}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowActivityModal(false)
                  setSelectedAdmin('')
                  fetchActivities()
                }}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

