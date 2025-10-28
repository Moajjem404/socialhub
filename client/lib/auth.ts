'use client'

import { apiBaseUrl } from './config'

export interface AdminUser {
  username: string
  role: 'OWNER' | 'ADMIN'
}

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

export const getAdminUser = (): AdminUser | null => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('admin_user')
    if (user) {
      try {
        return JSON.parse(user)
      } catch {
        return null
      }
    }
  }
  return null
}

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token)
  }
}

export const setAdminUser = (user: AdminUser) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_user', JSON.stringify(user))
  }
}

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('admin_user')
  }
}

export const isAuthenticated = (): boolean => {
  return !!getAuthToken()
}

export const isOwner = (): boolean => {
  const user = getAdminUser()
  return user?.role === 'OWNER'
}

export const verifySession = async (): Promise<boolean> => {
  const token = getAuthToken()
  
  if (!token) {
    return false
  }

  try {
    const response = await fetch(`${apiBaseUrl}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      return true
    } else {
      clearAuth()
      return false
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    clearAuth()
    return false
  }
}

export const logout = async (): Promise<void> => {
  const token = getAuthToken()
  
  if (token) {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  clearAuth()
}

