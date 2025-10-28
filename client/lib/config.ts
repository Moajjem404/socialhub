/**
 * Application Configuration
 * 
 * This file centralizes all environment-based configuration.
 * Automatically detects API URL based on current host for network access support.
 */

// Get API URL from environment variable or auto-detect from browser
const getApiUrl = (): string => {
  // Check if environment variable is set
  const envApiUrl = process.env.NEXT_PUBLIC_API_URL
  
  if (envApiUrl) {
    return envApiUrl
  }
  
  // Auto-detect API URL based on current window location (browser only)
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol // http: or https:
    const hostname = window.location.hostname // localhost or 192.168.0.108 or domain
    const apiPort = '3001' // Backend port
    
    return `${protocol}//${hostname}:${apiPort}`
  }
  
  // Server-side fallback
  return 'http://localhost:3001'
}

// Get Socket.IO URL (same as API URL but without /api)
const getSocketUrl = (): string => {
  return getApiUrl()
}

// Export configuration
export const config = {
  // Full API base URL (includes /api)
  apiBaseUrl: `${getApiUrl()}/api`,
  
  // Socket.IO server URL
  socketUrl: getSocketUrl(),
  
  // API timeout in milliseconds
  apiTimeout: 10000,
  
  // Get raw API URL without /api suffix
  apiUrl: getApiUrl(),
}

// Export individual values for convenience
export const { apiBaseUrl, socketUrl, apiTimeout, apiUrl } = config

export default config
