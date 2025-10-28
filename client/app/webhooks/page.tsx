'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Zap, 
  Globe, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { useSocket } from '@/contexts/SocketContext'
import toast from 'react-hot-toast'

interface Webhook {
  _id: string
  name: string
  url: string
  type: 'REACTION' | 'COMMENT' | 'ORDER' | 'USER_BAN' | 'DATA_CLEANUP'
  isActive: boolean
  headers: any
  description?: string
  createdAt: string
  updatedAt: string
}

export default function WebhookManagement() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    url: string
    type: 'REACTION' | 'COMMENT' | 'ORDER' | 'USER_BAN' | 'DATA_CLEANUP'
    headers: any
    description: string
    isActive: boolean
  }>({
    name: '',
    url: '',
    type: 'REACTION',
    headers: {},
    description: '',
    isActive: true
  })
  const { socket } = useSocket()

  useEffect(() => {
    fetchWebhooks()
    
    if (socket) {
      socket.on('webhook_created', (webhook) => {
        setWebhooks(prev => [webhook, ...prev])
        toast.success('New webhook created!')
      })
      
      socket.on('webhook_updated', (webhook) => {
        setWebhooks(prev => prev.map(w => w._id === webhook._id ? webhook : w))
        toast.success('Webhook updated!')
      })
      
      socket.on('webhook_deleted', ({ id }) => {
        setWebhooks(prev => prev.filter(w => w._id !== id))
        toast.success('Webhook deleted!')
      })
    }

    return () => {
      if (socket) {
        socket.off('webhook_created')
        socket.off('webhook_updated')
        socket.off('webhook_deleted')
      }
    }
  }, [socket])

  const fetchWebhooks = async () => {
    try {
      const response = await apiService.getWebhooks()
      if (response.success) {
        setWebhooks(response.data as Webhook[])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingWebhook) {
        await apiService.updateWebhook(editingWebhook._id, formData)
        toast.success('Webhook updated successfully!')
      } else {
        await apiService.createWebhook(formData)
        toast.success('Webhook created successfully!')
      }
      setShowModal(false)
      setEditingWebhook(null)
      setFormData({
        name: '',
        url: '',
        type: 'REACTION',
        headers: {},
        description: '',
        isActive: true
      })
    } catch (error) {
      console.error('Error saving webhook:', error)
    }
  }

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      type: webhook.type,
      headers: webhook.headers,
      description: webhook.description || '',
      isActive: webhook.isActive
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      try {
        await apiService.deleteWebhook(id)
        toast.success('Webhook deleted successfully!')
      } catch (error) {
        console.error('Error deleting webhook:', error)
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'REACTION': return 'bg-blue-100 text-blue-800'
      case 'COMMENT': return 'bg-green-100 text-green-800'
      case 'ORDER': return 'bg-purple-100 text-purple-800'
      case 'USER_BAN': return 'bg-red-100 text-red-800'
      case 'DATA_CLEANUP': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'REACTION': return '📊'
      case 'COMMENT': return '💬'
      case 'ORDER': return '📦'
      case 'USER_BAN': return '🚫'
      case 'DATA_CLEANUP': return '🧹'
      default: return '⚙️'
    }
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
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold gradient-text">Webhook Management</h1>
                  <p className="text-xs sm:text-sm text-gray-600">Configure webhook endpoints</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Add Webhook</span>
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
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8"
        >
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Webhooks</p>
                <p className="stat-number">{webhooks.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Webhooks</p>
                <p className="stat-number">{webhooks.filter(w => w.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Inactive Webhooks</p>
                <p className="stat-number">{webhooks.filter(w => !w.isActive).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Types</p>
                <p className="stat-number">{new Set(webhooks.map(w => w.type)).size}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Webhooks List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Webhook Endpoints</h2>
            <p className="text-xs sm:text-sm text-gray-600">Manage your webhook configurations</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {webhooks.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <Zap className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No webhooks configured</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Get started by creating your first webhook endpoint</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary text-sm sm:text-base"
                >
                  Create Webhook
                </button>
              </div>
            ) : (
              webhooks.map((webhook, index) => (
                <motion.div
                  key={webhook._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-xl sm:text-2xl">{getTypeIcon(webhook.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{webhook.name}</h3>
                          <span className={`badge text-xs ${getTypeColor(webhook.type)}`}>
                            {webhook.type}
                          </span>
                          <span className={`badge text-xs ${webhook.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 break-all">{webhook.url}</p>
                        {webhook.description && (
                          <p className="text-xs sm:text-sm text-gray-500 mb-2">{webhook.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            Created: {new Date(webhook.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Updated: {new Date(webhook.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-2 sm:flex-shrink-0">
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="btn-secondary flex items-center justify-center space-x-1 flex-1 sm:flex-initial text-sm"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(webhook._id)}
                        className="btn-danger flex items-center justify-center space-x-1 flex-1 sm:flex-initial text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-strong max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingWebhook ? 'Edit Webhook' : 'Create New Webhook'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <label className="label">Webhook Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Enter webhook name"
                  required
                />
              </div>

              <div>
                <label className="label">Webhook URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="input"
                  placeholder="https://your-webhook-url.com/endpoint"
                  required
                />
              </div>

              <div>
                <label className="label">Webhook Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="input"
                >
                  <option value="REACTION">Reaction Events</option>
                  <option value="COMMENT">Comment Events</option>
                  <option value="ORDER">Order Events</option>
                  <option value="USER_BAN">User Ban Events</option>
                  <option value="DATA_CLEANUP">Data Cleanup Events</option>
                </select>
              </div>

              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Describe what this webhook is used for"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingWebhook(null)
                    setFormData({
                      name: '',
                      url: '',
                      type: 'REACTION',
                      headers: {},
                      description: '',
                      isActive: true
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
