'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, User, Eye, EyeOff, Shield, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiBaseUrl } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [isSetup, setIsSetup] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('auth_token')
    if (token) {
      verifyToken(token)
    } else {
      checkSetupStatus()
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        router.push('/')
      } else {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('admin_user')
        checkSetupStatus()
      }
    } catch (error) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_user')
      checkSetupStatus()
    }
  }

  const checkSetupStatus = async () => {
    try {
      setConnectionError(false)
      const response = await fetch(`${apiBaseUrl}/auth/check-setup`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setIsSetup(data.needsSetup)
        setConnectionError(false)
      }
    } catch (error: any) {
      console.error('Error checking setup status:', error)
      setConnectionError(true)
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        toast.error('Connection timeout. Please check if the server is running.')
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Cannot connect to server. Please ensure backend is running on the configured URL.')
      } else {
        toast.error(`Failed to connect: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      toast.error('Please enter username and password')
      return
    }

    setSubmitting(true)
    setConnectionError(false)

    try {
      const endpoint = isSetup 
        ? `${apiBaseUrl}/auth/setup-owner`
        : `${apiBaseUrl}/auth/login`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      const data = await response.json()

      if (response.ok && data.success) {
        if (isSetup) {
          toast.success('Owner account created! Please login.')
          setIsSetup(false)
          setFormData({ username: '', password: '' })
        } else {
          toast.success('Login successful!')
          localStorage.setItem('auth_token', data.token)
          localStorage.setItem('admin_user', JSON.stringify(data.admin))
          router.push('/')
        }
      } else {
        toast.error(data.message || 'Authentication failed')
      }
    } catch (error: any) {
      console.error('Authentication error:', error)
      
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection.')
        setConnectionError(true)
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error('Cannot reach server. Please ensure backend is running.')
        setConnectionError(true)
      } else {
        toast.error('Failed to authenticate. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="text-center">
          <div className="loading-spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-white text-sm">Connecting to server...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isSetup ? 'Welcome to SocialHub' : 'SocialHub Management'}
          </h1>
          <p className="text-white/80">
            {isSetup 
              ? 'Create your owner account to get started' 
              : 'Sign in to manage your social hub'}
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20"
        >
          {/* Connection Error Banner */}
          {connectionError && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-1">
                  <p className="text-red-100 text-sm font-semibold mb-2">
                    ⚠️ Cannot Connect to Server
                  </p>
                  <p className="text-red-100/80 text-xs mb-3">
                    Please ensure the backend server is running on: <code className="bg-red-900/30 px-2 py-1 rounded">{apiBaseUrl.replace('/api', '')}</code>
                  </p>
                  <button
                    onClick={() => {
                      setLoading(true)
                      checkSetupStatus()
                    }}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors"
                  >
                    🔄 Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}

          {isSetup && !connectionError && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-100 text-sm">
                <strong>First Time Setup:</strong> Create your owner account. This account will have full access to all features including admin management.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-white/50" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                  placeholder="Enter your username"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-white/50" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  autoComplete={isSetup ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {isSetup && (
                <p className="text-white/60 text-xs mt-2">
                  Use a strong password with at least 8 characters
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="loading-spinner w-5 h-5 border-purple-600"></div>
                  <span>{isSetup ? 'Creating Account...' : 'Logging in...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{isSetup ? 'Create Owner Account' : 'Login to Dashboard'}</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          {connectionError ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
              <p className="text-white font-semibold text-sm mb-3">🛍️ Troubleshooting Steps:</p>
              <ol className="text-white/80 text-xs space-y-2 list-decimal list-inside">
                <li>Check if backend server is running: <code className="bg-white/20 px-2 py-1 rounded">npm run server</code></li>
                <li>Verify server is on port 3001: <code className="bg-white/20 px-2 py-1 rounded">http://localhost:3001</code></li>
                <li>Check <code className="bg-white/20 px-2 py-1 rounded">/client/.env.local</code> has correct API URL</li>
                <li>Restart both frontend and backend servers</li>
                <li>Check MongoDB connection in <code className="bg-white/20 px-2 py-1 rounded">/server/.env</code></li>
              </ol>
            </div>
          ) : (
            <p className="text-white/60 text-sm">
              Secured with end-to-end encryption
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

