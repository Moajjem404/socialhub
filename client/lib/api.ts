'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { apiBaseUrl, apiTimeout } from './config'

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  stats?: any
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

class ApiService {
  private static instance: ApiService

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  private getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<ApiResponse<T>> {
    try {
      const config = {
        method,
        url: `${apiBaseUrl}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        timeout: apiTimeout,
      }

      const response = await axios(config)
      return response.data
    } catch (error: any) {
      let errorMessage = 'An error occurred'
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.'
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('admin_user')
          window.location.href = '/login'
        }
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.'
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Only show toast for non-429 errors to avoid spam
      if (error.response?.status !== 429) {
        toast.error(errorMessage)
      }
      
      throw new Error(errorMessage)
    }
  }

  // Dashboard Stats
  async getDashboardStats() {
    return this.request('GET', '/dashboard-stats')
  }

  // Webhook Management
  async getWebhooks() {
    return this.request('GET', '/webhooks')
  }

  async createWebhook(data: {
    name: string
    url: string
    type: 'REACTION' | 'COMMENT' | 'ORDER' | 'USER_BAN' | 'DATA_CLEANUP'
    headers?: any
    description?: string
  }) {
    return this.request('POST', '/webhooks', data)
  }

  async updateWebhook(id: string, data: any) {
    return this.request('PUT', `/webhooks/${id}`, data)
  }

  async deleteWebhook(id: string) {
    return this.request('DELETE', `/webhooks/${id}`)
  }

  // User Management
  async banUser(data: {
    user_id: string
    user_name?: string
    ban_type: 'REACTION' | 'COMMENT' | 'ALL'
    reason?: string
    banned_by: string
  }) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${apiBaseUrl}/ban-user`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        timeout: apiTimeout,
        validateStatus: (status) => status < 500, // Accept all status codes below 500
      });
      
      // Always return response.data, even for 409 (user already banned)
      return response.data;
    } catch (error: any) {
      console.error('Ban user error:', error);
      let errorMessage = 'Failed to ban user';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Data Cleanup
  async cleanupOldData() {
    return this.request('DELETE', '/cleanup-old-data')
  }

  // Reactions
  async getReactions(page = 1, limit = 50) {
    return this.request('GET', `/all-reactions?page=${page}&limit=${limit}`)
  }

  async getReactionStats() {
    return this.request('GET', '/reaction-stats')
  }

  async saveReaction(data: any) {
    return this.request('POST', '/save-reaction', data)
  }

  // Comments
  async getComments(page = 1, limit = 50) {
    return this.request('GET', `/all-comments?page=${page}&limit=${limit}`)
  }

  async getCommentStats() {
    return this.request('GET', '/comment-stats')
  }

  async saveComment(data: any) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${apiBaseUrl}/save-comment`,
        data,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
        timeout: apiTimeout,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Save comment error:', error);
      let errorMessage = 'Failed to save comment';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async replyToComment(data: {
    parent_comment_id: string
    reply_text: string
    user_id: string
    user_name?: string
    post_id: string
    delete_after_reply?: boolean
  }) {
    return this.request('POST', '/reply-comment', data)
  }

  async deleteComment(commentId: string, deleteOption: 'database' | 'facebook' | 'both') {
    return this.request('DELETE', `/delete-comment/${commentId}`, { deleteOption })
  }

  // Banned Users Management
  async getBannedUsers(page = 1, limit = 50, filterType = 'ALL') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (filterType && filterType !== 'ALL') {
      params.append('filterType', filterType)
    }
    return this.request('GET', `/banned-users?${params.toString()}`)
  }

  async getBanStats() {
    return this.request('GET', '/ban-stats')
  }

  async unbanUser(userId: string) {
    return this.request('PUT', `/unban-user/${userId}`)
  }

  async removeUserData(userId: string, removeReason: string, removedBy: string) {
    return this.request('DELETE', `/remove-user-data/${userId}`, {
      remove_reason: removeReason,
      removed_by: removedBy
    })
  }

  // Orders
  async getOrders(page = 1, limit = 50, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (status && status !== 'ALL') {
      params.append('status', status)
    }
    return this.request('GET', `/all-orders?${params.toString()}`)
  }

  async getOrderStats() {
    return this.request('GET', '/order-stats')
  }

  async createOrder(data: {
    name: string
    number: string
    address: string
    product_name: string
    total_product: number
    total_price: number
    text?: string
    sender_id: string
    recipient_id: string
  }) {
    return this.request('POST', '/create-order', data)
  }

  async updateOrderStatus(orderId: string, status: string, reason?: string, message?: string) {
    return this.request('PUT', `/update-order-status/${orderId}`, {
      status,
      reason,
      message,
    })
  }

  // Admin Management (Owner Only)
  async getAdmins() {
    return this.request('GET', '/admins')
  }

  async createAdmin(data: { username: string; password: string }) {
    return this.request('POST', '/admins', data)
  }

  async deleteAdmin(username: string) {
    return this.request('DELETE', `/admins/${username}`)
  }

  async toggleAdminStatus(username: string) {
    return this.request('PUT', `/admins/${username}/toggle`)
  }

  async getAdminActivities(page = 1, limit = 50) {
    return this.request('GET', `/admin-activities?page=${page}&limit=${limit}`)
  }

  async getUserActivities(username: string, page = 1, limit = 50) {
    return this.request('GET', `/admin-activities/${username}?page=${page}&limit=${limit}`)
  }

  // Settings
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('PUT', '/auth/change-password', data)
  }

  async getCurrentAdmin() {
    return this.request('GET', '/auth/me')
  }

  // Products
  async getProducts(page = 1, limit = 50, status?: string, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (status && status !== 'ALL') {
      params.append('status', status)
    }
    if (search) {
      params.append('search', search)
    }
    return this.request('GET', `/products?${params.toString()}`)
  }

  async getProductStats() {
    return this.request('GET', '/product-stats')
  }

  async createProduct(data: {
    productName: string
    brandName?: string
    shortDescription?: string
    price: number
    discount?: number
    stockQuantity: number
    productCode: string
    status?: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'
  }) {
    return this.request('POST', '/products', data)
  }

  async updateProduct(productId: string, data: any) {
    return this.request('PUT', `/products/${productId}`, data)
  }

  async deleteProduct(productId: string) {
    return this.request('DELETE', `/products/${productId}`)
  }

  async getProduct(productId: string) {
    return this.request('GET', `/products/${productId}`)
  }

  async getPublicProducts(page = 1, limit = 100, status?: string) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (status && status !== 'ALL') {
        params.append('status', status)
      }
      
      const response = await axios({
        method: 'GET',
        url: `${apiBaseUrl}/public/products?${params.toString()}`,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: apiTimeout,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Get public products error:', error);
      let errorMessage = 'Failed to fetch products';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // API Keys methods - REMOVED (system reverted to open access)
}

export const apiService = ApiService.getInstance()
export default apiService
